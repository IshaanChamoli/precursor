import * as vscode from 'vscode';
import { AuthService } from '../services/auth';
import { FileTrackerService } from '../features/home/fileTracker/fileTrackerService';
import { getLoginView } from '../features/login/loginView';
import { getHomeView } from '../features/home/homeView';

/**
 * Routes to the appropriate view based on authentication state
 * Shared by both sidebar and panel views
 */
export async function getHtmlContent(
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
	authService: AuthService
): Promise<string> {
	const logoUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'icons', 'logo.png'));

	// Check if user is authenticated
	const user = await authService.getCurrentUser();

	if (user) {
		// Extract first name from user's name
		const firstName = user.name ? user.name.split(' ')[0] : user.email.split('@')[0];
		// Pass full name for initials fallback
		const fullName = user.name || user.email.split('@')[0];

		// Get root files using FileTrackerService
		const fileTrackerService = new FileTrackerService();
		const files = await fileTrackerService.getRootFiles();

		return getHomeView(firstName, fullName, logoUri.toString(), user.github_picture, files);
	}

	return getLoginView(logoUri.toString());
}
