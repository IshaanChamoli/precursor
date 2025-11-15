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
	}

	/**
	 * Get the HTML content for the current state
	 */
	protected async getContent(webview: vscode.Webview): Promise<string> {
		return getHtmlContent(webview, this._extensionUri, this._authService);
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
