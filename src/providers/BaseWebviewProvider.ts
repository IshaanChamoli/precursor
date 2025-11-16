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

		// Listen for file changes and refresh the view
		this._disposables.push(
			this._fileTrackerService.onDidChange(refreshCallback)
		);

		// Listen for text document changes (ANY file, not just active)
		this._disposables.push(
			vscode.workspace.onDidChangeTextDocument(event => {
				// Send content for ANY file that changes
				this._sendDocumentContent(event.document);
			})
		);

		// Listen for when documents are saved (to clear isDirty flag)
		this._disposables.push(
			vscode.workspace.onDidSaveTextDocument(document => {
				// Send updated content with isDirty = false
				this._sendDocumentContent(document);
			})
		);

		// Listen for when documents are closed (to clean up tracking)
		this._disposables.push(
			vscode.workspace.onDidCloseTextDocument(document => {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders || !this._currentWebview) {
					return;
				}

				const rootPath = workspaceFolders[0].uri.path;
				const filePath = document.uri.path;
				const relativePath = filePath.replace(rootPath + '/', '');

				// Tell webview to remove this file from tracking
				this._currentWebview.postMessage({
					type: 'removeUnsavedContent',
					filePath: relativePath
				});

				console.log('[BASE PROVIDER] Document closed, removed from tracking:', relativePath);
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
	 * Send document content to webview for diff tracking
	 * Tracks ALL documents, not just the active one
	 */
	private _sendDocumentContent(document: vscode.TextDocument) {
		if (!this._currentWebview) {
			return;
		}

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return;
		}

		// Skip non-file documents (like output panels, git diff views, etc.)
		if (document.uri.scheme !== 'file') {
			return;
		}

		// Get the file path relative to workspace root
		const rootPath = workspaceFolders[0].uri.path;
		const filePath = document.uri.path;

		// Skip files outside workspace
		if (!filePath.startsWith(rootPath)) {
			return;
		}

		const relativePath = filePath.replace(rootPath + '/', '');

		// Get the current content (saved or unsaved)
		const content = document.getText();

		// Send to webview
		this._currentWebview.postMessage({
			type: 'documentContent',
			filePath: relativePath,
			content: content,
			isDirty: document.isDirty
		});

		console.log('[BASE PROVIDER] Sent document content for:', relativePath, 'isDirty:', document.isDirty);
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
