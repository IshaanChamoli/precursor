import * as vscode from 'vscode';
import { AuthService } from '../services/auth';
import { FileTrackerService } from '../features/home/fileTracker/fileTrackerService';
import { getHtmlContent } from './contentRouter';

/**
 * ⚠️ IMPORTANT: Base class for ALL webview providers (sidebar and panel)
 *
 * ✅ To add event listeners that apply to BOTH views: Edit setupListeners() below
 * ✅ To change how messages are handled in BOTH views: Edit handleMessage() below
 * ✅ To modify content routing for BOTH views: Edit contentRouter.ts
 *
 * Both SidebarViewProvider and PanelViewProvider extend this class and share all logic.
 * Any changes here automatically apply to both sidebar and panel - zero duplication!
 */
export abstract class BaseWebviewProvider {
	protected _disposables: vscode.Disposable[] = [];
	protected _currentWebview?: vscode.Webview;

	constructor(
		protected readonly _extensionUri: vscode.Uri,
		protected readonly _authService: AuthService,
		protected readonly _fileTrackerService: FileTrackerService
	) {}

	/**
	 * Set up listeners for auth and file changes
	 * Call this from subclasses after they're ready to handle updates
	 */
	protected setupListeners(refreshCallback: () => void) {
		// Listen for auth state changes and refresh the view
		this._disposables.push(
			this._authService.onAuthStateChanged(refreshCallback)
		);

		// Listen for file changes (tracks ALL workspace files, even closed ones)
		// NOTE: We don't refresh HTML here - we send messages to update frontend instead
		// Refreshing HTML would lose the current file viewer state!
		this._disposables.push(
			this._fileTrackerService.onDidChange(() => {
				// File list will be updated via document change messages
				// No need to refresh entire HTML and lose viewer state
				console.log('[BASE PROVIDER] File changed, but not refreshing HTML (would lose viewer state)');
			})
		);

		// Listen for text document changes (open files - live unsaved edits)
		this._disposables.push(
			vscode.workspace.onDidChangeTextDocument(event => {
				// Track live edits in open documents
				this._sendDocumentContent(event.document);

				// Update backend cache with live content
				const relativePath = this._getRelativePath(event.document);
				if (relativePath && event.document.isDirty) {
					this._fileTrackerService.updateLiveContent(relativePath, event.document.getText());
				}
			})
		);

		// Listen for when documents are saved (to clear isDirty flag)
		this._disposables.push(
			vscode.workspace.onDidSaveTextDocument(document => {
				// Update with isDirty = false when saved
				this._sendDocumentContent(document);

				// Transition states in backend: currentSaved → previousSaved, liveUnsaved → currentSaved
				const relativePath = this._getRelativePath(document);
				if (relativePath) {
					this._fileTrackerService.transitionOnSave(relativePath, document.getText());
				}
			})
		);

		// Listen for when documents are closed
		this._disposables.push(
			vscode.workspace.onDidCloseTextDocument(document => {
				// Only remove from tracking if file was saved (not dirty)
				// Keep dirty files in tracking even when closed (important for AI context!)
				if (!document.isDirty) {
					const relativePath = this._getRelativePath(document);
					if (!relativePath || !this._currentWebview) {
						return;
					}

					// Clear liveUnsaved in backend
					this._fileTrackerService.updateLiveContent(relativePath, null);

					// Notify webview
					this._currentWebview.postMessage({
						type: 'removeUnsavedContent',
						filePath: relativePath
					});

					console.log('[BASE PROVIDER] Document closed and clean, removed from tracking:', relativePath);
				} else {
					console.log('[BASE PROVIDER] Document closed but dirty, keeping in tracking for AI context');
				}
			})
		);

		// Listen for active editor changes (to refresh closed dirty files when reopened)
		this._disposables.push(
			vscode.window.onDidChangeActiveTextEditor(editor => {
				if (editor) {
					// Refresh content when file is opened/focused
					this._sendDocumentContent(editor.document);
				}
			})
		);

		// Listen for NEW files being opened (including unsaved "Untitled-1" etc.)
		this._disposables.push(
			vscode.workspace.onDidOpenTextDocument(document => {
				// Track new files immediately, even if unsaved
				this._sendDocumentContent(document);
				console.log('[BASE PROVIDER] New document opened:', document.uri.path, 'isUntitled:', document.isUntitled);
			})
		);

		// Send initial content for ALL currently open documents
		vscode.workspace.textDocuments.forEach(document => {
			this._sendDocumentContent(document);
		});

		console.log('[BASE PROVIDER] Sent initial content for', vscode.workspace.textDocuments.length, 'open documents');
	}

	/**
	 * Get the HTML content for the current state
	 */
	protected async getContent(webview: vscode.Webview): Promise<string> {
		return getHtmlContent(webview, this._extensionUri, this._authService);
	}

	/**
	 * Get relative path for a document (handles both file and untitled schemes)
	 */
	private _getRelativePath(document: vscode.TextDocument): string | null {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return null;
		}

		// Skip non-file/non-untitled documents
		if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
			return null;
		}

		if (document.uri.scheme === 'untitled') {
			const fileName = document.uri.path.split('/').pop() || `Untitled-${Date.now()}`;
			return `[unsaved]/${fileName}`;
		} else {
			const rootPath = workspaceFolders[0].uri.path;
			const filePath = document.uri.path;

			// Skip files outside workspace
			if (!filePath.startsWith(rootPath)) {
				return null;
			}

			return filePath.replace(rootPath + '/', '');
		}
	}

	/**
	 * Get folder path from workspace root using VSCode's path utilities
	 */
	private _getFolderPath(document: vscode.TextDocument, relativePath: string): string {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return 'root';
		}

		// Handle untitled files
		if (document.isUntitled || relativePath.startsWith('[unsaved]/')) {
			return '[unsaved]';
		}

		// Use VSCode's path utilities to get the directory
		const path = require('path');
		const dirPath = path.dirname(relativePath);

		// If file is in root, dirname returns '.'
		if (dirPath === '.' || dirPath === '') {
			return 'root';
		}

		// Convert path separators to ' > ' for display
		return 'root > ' + dirPath.split(path.sep).join(' > ');
	}

	/**
	 * Send document content to webview for diff tracking
	 * Tracks ALL documents, including unsaved "Untitled" files
	 */
	private _sendDocumentContent(document: vscode.TextDocument) {
		if (!this._currentWebview) {
			return;
		}

		const relativePath = this._getRelativePath(document);
		if (!relativePath) {
			return;
		}

		// Get the current content (saved or unsaved)
		const content = document.getText();

		// Get folder path using VSCode's path utilities
		const folderPath = this._getFolderPath(document, relativePath);

		// Send to webview
		this._currentWebview.postMessage({
			type: 'documentContent',
			filePath: relativePath,
			folderPath: folderPath,
			content: content,
			isDirty: document.isDirty,
			isUntitled: document.isUntitled
		});

		console.log('[BASE PROVIDER] Sent document content for:', relativePath, 'folderPath:', folderPath, 'isDirty:', document.isDirty, 'isUntitled:', document.isUntitled);
	}

	/**
	 * Handle messages from the webview
	 */
	protected async handleMessage(message: any, webview?: vscode.Webview): Promise<void> {
		switch (message.command || message.type) {
			case 'login':
				await this._authService.login();
				return;
		}
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		this._disposables.forEach(d => d.dispose());
	}
}
