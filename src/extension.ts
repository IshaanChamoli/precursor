// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AuthService } from './services/auth';
import { FileTrackerService } from './features/home/fileTracker/fileTrackerService';
import { SidebarViewProvider } from './providers/SidebarViewProvider';
import { PanelViewProvider } from './providers/PanelViewProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "precursor" is now active!');

	// Initialize auth service
	const authService = new AuthService(context);

	// Initialize file tracker service
	const fileTrackerService = new FileTrackerService();
	fileTrackerService.startWatching();
	context.subscriptions.push(fileTrackerService);

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
	const sidebarProvider = new SidebarViewProvider(context.extensionUri, authService, fileTrackerService);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('precursor.view', sidebarProvider)
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

		// Create panel provider - handles all content, listeners, and messages
		new PanelViewProvider(panel, context.extensionUri, authService, fileTrackerService);
	});

	context.subscriptions.push(openPanelCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
