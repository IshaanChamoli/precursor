import * as vscode from 'vscode';

export interface FileInfo {
	name: string;
	path: string; // Relative path from workspace root (e.g., "src > components > Header.tsx")
	firstLine: string;
}

export class FileTrackerService {
	private _onDidChangeEmitter = new vscode.EventEmitter<void>();
	public readonly onDidChange = this._onDidChangeEmitter.event;
	private _fileWatcher?: vscode.FileSystemWatcher;

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

		// Trigger refresh on any file change
		this._fileWatcher.onDidCreate(() => this._onDidChangeEmitter.fire());
		this._fileWatcher.onDidChange(() => this._onDidChangeEmitter.fire());
		this._fileWatcher.onDidDelete(() => this._onDidChangeEmitter.fire());
	}

	/**
	 * Stop watching for file changes and clean up
	 */
	dispose() {
		this._fileWatcher?.dispose();
		this._onDidChangeEmitter.dispose();
	}

	/**
	 * Get all files in the entire workspace recursively
	 * and read the first line of each file
	 */
	async getRootFiles(): Promise<FileInfo[]> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		const rootPath = workspaceFolders[0].uri;
		const fileList: FileInfo[] = [];

		// Recursively scan directories
		await this._scanDirectory(rootPath, rootPath, fileList);

		return fileList;
	}

	/**
	 * Recursively scan a directory and collect all files
	 */
	private async _scanDirectory(
		dirUri: vscode.Uri,
		rootUri: vscode.Uri,
		fileList: FileInfo[]
	): Promise<void> {
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
					await this._scanDirectory(entryUri, rootUri, fileList);
				} else if (type === vscode.FileType.File) {
					try {
						// Read first line of file
						const content = await vscode.workspace.fs.readFile(entryUri);
						const text = Buffer.from(content).toString('utf8');
						const firstLine = text.split('\n')[0] || '';

						// Calculate relative path from root (directory only, no filename)
						const relativePath = entryUri.path.replace(rootUri.path + '/', '');
						const pathParts = relativePath.split('/');
						// Remove the filename (last part) to get just the directory path
						pathParts.pop();

						// Build path: "root" if in root directory, otherwise "root > folders"
						const folderPath = pathParts.length === 0
							? 'root'
							: 'root > ' + pathParts.join(' > ');

						fileList.push({
							name,
							path: folderPath,
							firstLine: firstLine.substring(0, 100) // Truncate to 100 chars
						});
					} catch (err) {
						// Skip files we can't read (binary files, permissions, etc.)
						console.log(`Could not read file ${name}:`, err);
					}
				}
			}
		} catch (err) {
			console.log(`Could not read directory ${dirUri.path}:`, err);
		}
	}
}
