// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "precursor" is now active!');

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
	const provider = new PrecursorViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('precursor.view', provider)
	);

	// Register command to open moveable panel
	const openPanelCommand = vscode.commands.registerCommand('precursor.openPanel', () => {
		const panel = vscode.window.createWebviewPanel(
			'precursorPanel',
			'Precursor',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		panel.webview.html = getHtmlContent();
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
function getHtmlContent() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Precursor</title>
</head>
<body>
	<h1>Hello World from precursor!</h1>
	<p>This panel can be moved anywhere!</p>
</body>
</html>`;
}

// Webview provider for the sidebar
class PrecursorViewProvider implements vscode.WebviewViewProvider {
	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		// Set options for the webview
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		// Set the HTML content
		webviewView.webview.html = getHtmlContent();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
