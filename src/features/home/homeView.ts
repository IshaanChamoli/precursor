import { FileInfo } from './fileTracker/fileTrackerService';
import { getFileTrackerHTML, getFileTrackerCSS } from './fileTracker/fileTrackerView';

// Main app homepage - shown after user is authenticated
// This is your main product view that will be built out with features
export function getHomeView(
	firstName: string,
	fullName: string,
	logoUri: string,
	profilePicture: string | null,
	files: FileInfo[]
): string {
	// Extract initials from name (first letter of first word + first letter of last word)
	function getInitials(name: string): string {
		const words = name.trim().split(/\s+/);
		if (words.length === 0) return '?';
		if (words.length === 1) return words[0][0].toUpperCase();
		return (words[0][0] + words[words.length - 1][0]).toUpperCase();
	}

	const initials = getInitials(fullName);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Precursor</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			background-color: var(--vscode-editor-background);
			color: var(--vscode-foreground);
			min-height: 100vh;
		}

		/* Header with logo and branding */
		.header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--vscode-panel-border);
		}

		.header-logo {
			width: 24px;
			height: 24px;
			flex-shrink: 0;
		}

		.header-logo img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		.header-title {
			font-size: 14px;
			font-weight: 600;
			color: var(--vscode-foreground);
			flex: 1; /* Push profile picture to the right */
		}

		.profile-picture {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			object-fit: cover;
			border: 1px solid var(--vscode-panel-border);
		}

		.profile-initials {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 11px;
			font-weight: 600;
			border: 1px solid var(--vscode-panel-border);
		}

		/* Main content area */
		.content {
			padding: 20px 16px;
		}

		.greeting {
			font-size: 24px;
			font-weight: 600;
			margin-bottom: 8px;
			color: var(--vscode-foreground);
		}

		.subtitle {
			font-size: 14px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 24px;
		}

		${getFileTrackerCSS()}
	</style>
</head>
<body>
	<!-- Header with logo and branding -->
	<div class="header">
		<div class="header-logo">
			<img src="${logoUri}" alt="Precursor Logo">
		</div>
		<span class="header-title">Precursor</span>
		${profilePicture
			? `<img src="${profilePicture}" alt="Profile" class="profile-picture">`
			: `<div class="profile-initials">${initials}</div>`
		}
	</div>

	<!-- Main content -->
	<div class="content">
		<h1 class="greeting">Hi, ${firstName}</h1>
		<p class="subtitle">Learn while you vibecode...</p>

		${getFileTrackerHTML(files)}
	</div>
</body>
</html>`;
}
