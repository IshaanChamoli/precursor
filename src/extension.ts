// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getLoginView } from './views/loginView';
import { getHomeView } from './views/homeView';
import { AuthService } from './services/auth';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "precursor" is now active!');

	// Initialize auth service
	const authService = new AuthService(context);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('precursor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from precursor: the future of learning code!');
	});

	context.subscriptions.push(disposable);

	// Register the webview provider for the sidebar
	const provider = new PrecursorViewProvider(context.extensionUri, authService);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('precursor.view', provider)
	);

	// Register command to open moveable panel
	const openPanelCommand = vscode.commands.registerCommand('precursor.openPanel', async () => {
		const panel = vscode.window.createWebviewPanel(
			'precursorPanel',
			'Precursor',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		// Initial content
		panel.webview.html = await getHtmlContent(panel.webview, context.extensionUri, authService);

		// Listen for auth state changes and refresh the panel
		const authListener = authService.onAuthStateChanged(async () => {
			panel.webview.html = await getHtmlContent(panel.webview, context.extensionUri, authService);
		});

		// Clean up listener when panel is disposed
		panel.onDidDispose(() => {
			authListener.dispose();
		});

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'login':
						await authService.login();
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(openPanelCommand);
}

// ============================================================================
// ⚠️  CRITICAL: SHARED HTML CONTENT FOR BOTH SIDEBAR AND PANEL
// ============================================================================
// This function is used by BOTH the sidebar view AND the moveable panel.
//
// ANY changes here will affect BOTH views!
//
// ❌ NEVER write view-specific code here without explicit approval
// ❌ NEVER create separate HTML for just one view without consulting this comment
//
// If you need different behavior for sidebar vs panel:
// 1. STOP and read this comment again
// 2. Discuss why they need to be different
// 3. Get explicit permission before splitting them
// 4. If approved, create separate functions: getSidebarHtml() and getPanelHtml()
//
// Current architecture: ONE shared HTML for consistency and maintainability
// ============================================================================
async function getHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri, authService: AuthService) {
	const logoUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'icons', 'logo.png'));

	// Check if user is authenticated
	const user = await authService.getCurrentUser();

	if (user) {
		// Extract first name from user's name
		const firstName = user.name ? user.name.split(' ')[0] : user.email.split('@')[0];
		return getHomeView(firstName, logoUri.toString());
	}

	return getLoginView(logoUri.toString());
}

// Webview provider for the sidebar
class PrecursorViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _authService: AuthService
	) {
		// Listen for auth state changes and refresh the view
		this._authService.onAuthStateChanged(() => {
			if (this._view) {
				this._updateWebview(this._view);
			}
		});
	}

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		// Set options for the webview
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		// Set the HTML content
		await this._updateWebview(webviewView);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async message => {
			switch (message.command) {
				case 'login':
					await this._authService.login();
					return;
			}
		});
	}

	private async _updateWebview(webviewView: vscode.WebviewView) {
		webviewView.webview.html = await getHtmlContent(webviewView.webview, this._extensionUri, this._authService);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
