import * as vscode from 'vscode';
import { BaseWebviewProvider } from './BaseWebviewProvider';

/**
 * Webview provider for the sidebar view
 */
export class SidebarViewProvider extends BaseWebviewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		// Set options for the webview
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		// Set the HTML content
		await this._updateWebview();

		// Set up listeners for updates (from base class)
		this.setupListeners(() => this._updateWebview());

		// Handle messages from the webview (from base class)
		webviewView.webview.onDidReceiveMessage(async message => {
			await this.handleMessage(message, webviewView.webview);
		});
	}

	private async _updateWebview() {
		console.log('[SIDEBAR PROVIDER] _updateWebview() called - REPLACING ENTIRE HTML');
		if (this._view) {
			this._view.webview.html = await this.getContent(this._view.webview);
			console.log('[SIDEBAR PROVIDER] HTML replaced');
		}
	}
}
