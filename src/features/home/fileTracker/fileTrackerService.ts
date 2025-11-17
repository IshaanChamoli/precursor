import * as vscode from 'vscode';

export interface FileInfo {
	name: string;
	path: string; // Folder path from workspace root (e.g., "root > src > components")
	fullPath: string; // Full relative path including filename (e.g., "src/components/Header.tsx")
	previousSaved?: string; // Previous saved version (for diff tracking - used for "Prev" view)
	currentSaved: string; // Current saved content of the file (for diff tracking)
	liveUnsaved?: string; // Live unsaved edits (for "Now" view - tracked from editor)
	lastModified: number; // Timestamp of last save
	isUnsaved?: boolean; // True if this is an unsaved file (like "Untitled-1")
}

export class FileTrackerService {
	private _onDidChangeEmitter = new vscode.EventEmitter<void>();
	public readonly onDidChange = this._onDidChangeEmitter.event;
	private _fileWatcher?: vscode.FileSystemWatcher;
	private _fileCache: Map<string, FileInfo> = new Map(); // Cache of all tracked files

	/**
	 * Start watching for file changes in the entire workspace
	 */
	startWatching() {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return;
		}

		// Watch for file changes in the entire workspace (all subdirectories)
		const rootPath = workspaceFolders[0].uri.fsPath;
		this._fileWatcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(rootPath, '**/*')
		);

		// Update cache when files are created
		this._fileWatcher.onDidCreate(async (uri) => {
			await this._updateFileInCache(uri);
			this._onDidChangeEmitter.fire();
		});

		// Update cache when files are saved/changed
		this._fileWatcher.onDidChange(async (uri) => {
			console.log('[FILE TRACKER SERVICE] File changed:', uri.path);
			await this._updateFileInCache(uri);
			console.log('[FILE TRACKER SERVICE] Firing onDidChange event');
			this._onDidChangeEmitter.fire();
		});

		// Remove from cache when files are deleted
		this._fileWatcher.onDidDelete((uri) => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders) {
				const relativePath = uri.path.replace(workspaceFolders[0].uri.path + '/', '');
				this._fileCache.delete(relativePath);
				this._onDidChangeEmitter.fire();
			}
		});
	}

	/**
	 * Stop watching for file changes and clean up
	 */
	dispose() {
		this._fileWatcher?.dispose();
		this._onDidChangeEmitter.dispose();
	}

	/**
	 * Get all tracked files with their current saved content
	 */
	async getRootFiles(): Promise<FileInfo[]> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		// If cache is empty, do initial scan
		if (this._fileCache.size === 0) {
			await this._initialScan(workspaceFolders[0].uri);
		}

		// Return cached files as array
		return Array.from(this._fileCache.values());
	}

	/**
	 * Update live unsaved content for a file
	 * Called from BaseWebviewProvider when tracking document changes
	 */
	updateLiveContent(filePath: string, content: string | null) {
		const file = this._fileCache.get(filePath);
		if (file) {
			file.liveUnsaved = content || undefined;
		} else {
			// File not in cache yet - create entry for unsaved file
			this._fileCache.set(filePath, {
				name: filePath.split('/').pop() || filePath,
				path: '[unsaved]',
				fullPath: filePath,
				previousSaved: undefined,
				currentSaved: '',
				liveUnsaved: content || undefined,
				lastModified: Date.now(),
				isUnsaved: true
			});
		}
	}

	/**
	 * Transition states when a file is saved
	 * currentSaved → previousSaved, liveUnsaved → currentSaved, liveUnsaved = null
	 */
	transitionOnSave(filePath: string, newSavedContent: string) {
		const file = this._fileCache.get(filePath);
		if (file) {
			file.previousSaved = file.currentSaved;
			file.currentSaved = newSavedContent;
			file.liveUnsaved = undefined;
			file.lastModified = Date.now();
		}
	}

	/**
	 * Initial scan of all files in workspace
	 */
	private async _initialScan(rootUri: vscode.Uri): Promise<void> {
		await this._scanDirectory(rootUri, rootUri);
	}

	/**
	 * Recursively scan a directory and cache all files with their content
	 */
	private async _scanDirectory(dirUri: vscode.Uri, rootUri: vscode.Uri): Promise<void> {
		try {
			const entries = await vscode.workspace.fs.readDirectory(dirUri);

			for (const [name, type] of entries) {
				// Skip common directories that should be ignored
				if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'out' || name === '.vscode') {
					continue;
				}

				const entryUri = vscode.Uri.joinPath(dirUri, name);

				if (type === vscode.FileType.Directory) {
					// Recursively scan subdirectories
					await this._scanDirectory(entryUri, rootUri);
				} else if (type === vscode.FileType.File) {
					// Update file in cache
					await this._updateFileInCache(entryUri);
				}
			}
		} catch (err) {
			console.log(`Could not read directory ${dirUri.path}:`, err);
		}
	}

	/**
	 * Update a single file in the cache with its current content
	 */
	private async _updateFileInCache(fileUri: vscode.Uri): Promise<void> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return;
		}

		const rootUri = workspaceFolders[0].uri;
		const fileName = fileUri.path.split('/').pop() || '';

		// Skip directories and unwanted files
		if (fileName === 'node_modules' || fileName === '.git' || fileName === 'dist' ||
		    fileName === 'out' || fileName === '.vscode' || !fileName) {
			return;
		}

		try {
			// Calculate relative path from root
			const relativePath = fileUri.path.replace(rootUri.path + '/', '');
			const pathParts = relativePath.split('/');

			// Remove the filename (last part) to get just the directory path
			const filePathParts = [...pathParts];
			filePathParts.pop();

			// Build folder path: "root" if in root directory, otherwise "root > folders"
			const folderPath = filePathParts.length === 0
				? 'root'
				: 'root > ' + filePathParts.join(' > ');

			// Read file content
			const content = await vscode.workspace.fs.readFile(fileUri);
			const textContent = Buffer.from(content).toString('utf8');

			// Get file stats for last modified time
			const stats = await vscode.workspace.fs.stat(fileUri);

			// Check if file already exists in cache to preserve previous version
			const existingFile = this._fileCache.get(relativePath);

			// IMPORTANT: Preserve ALL tracked states! Don't overwrite them!
			// FileSystemWatcher is ONLY for detecting new files, not for updating content
			// Content updates happen through transitionOnSave() when user saves
			this._fileCache.set(relativePath, {
				name: fileName,
				path: folderPath,
				fullPath: relativePath,
				currentSaved: existingFile?.currentSaved || textContent, // Keep existing, or use disk content if new file
				previousSaved: existingFile?.previousSaved, // Keep existing previousSaved!
				liveUnsaved: existingFile?.liveUnsaved, // Keep existing liveUnsaved!
				lastModified: stats.mtime
			});
		} catch (err) {
			// Skip files we can't read (binary files, permissions, etc.)
			console.log(`Could not read file ${fileName}:`, err);
		}
	}
}
