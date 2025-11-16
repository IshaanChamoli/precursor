import * as vscode from 'vscode';
import { BaseWebviewProvider } from './BaseWebviewProvider';

/**
 * Provider for the moveable panel view
 */
export class PanelViewProvider extends BaseWebviewProvider {
	private _panel: vscode.WebviewPanel;

	constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		authService: any,
		fileTrackerService: any
	) {
		super(extensionUri, authService, fileTrackerService);
		this._panel = panel;
		this.initialize();
	}

	private async initialize() {
		// Set initial content
		this._panel.webview.html = await this.getContent(this._panel.webview);

		// Set up listeners for updates (from base class)
		this.setupListeners(() => this._updatePanel());

		// Handle messages from the webview (from base class)
		this._panel.webview.onDidReceiveMessage(async message => {
			await this.handleMessage(message, this._panel.webview);
		});

		// Clean up when panel is disposed
		this._panel.onDidDispose(() => {
			this.dispose();
		});
	}

	private async _updatePanel() {
		console.log('[PANEL PROVIDER] _updatePanel() called - REPLACING ENTIRE HTML');
		this._panel.webview.html = await this.getContent(this._panel.webview);
		console.log('[PANEL PROVIDER] HTML replaced');
	}
}
