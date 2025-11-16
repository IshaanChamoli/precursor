import { FileInfo, getFileTrackerHTML, getFileTrackerCSS, getFileTrackerJS } from './fileTracker';

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

	<!-- Prism.js for syntax highlighting -->
	<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
	<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css" rel="stylesheet" />

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
			height: 100vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		/* Header with logo and branding */
		.header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--vscode-panel-border);
			flex-shrink: 0;
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
		}

		.header-title .tagline {
			color: var(--vscode-descriptionForeground);
			font-size: 10px;
			font-weight: 400;
		}

		.header-spacer {
			flex: 1; /* Push profile to the right */
		}

		.profile-container {
			position: relative;
		}

		.profile-picture {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			object-fit: cover;
			border: 1px solid var(--vscode-panel-border);
			cursor: pointer;
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
			cursor: pointer;
		}

		.profile-dropdown {
			position: absolute;
			top: 36px;
			right: 0;
			background-color: var(--vscode-dropdown-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 8px 12px;
			font-size: 13px;
			color: var(--vscode-foreground);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			white-space: nowrap;
			z-index: 1000;
			display: none;
		}

		.profile-dropdown.show {
			display: block;
		}

		/* Main content area */
		.content {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		/* Two-panel layout - stacked vertically */
		.panels-container {
			display: flex;
			flex-direction: column;
			flex: 1;
			overflow: hidden;
		}

		.panel {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			padding: 20px 16px;
		}

		.panel.panel-top {
			border-bottom: 1px solid var(--vscode-panel-border);
		}

		.panel-title {
			font-size: 18px;
			font-weight: 600;
			color: var(--vscode-foreground);
			margin-bottom: 12px;
		}

		.ai-insights-placeholder {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--vscode-descriptionForeground);
			font-size: 12px;
			opacity: 0.5;
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
		<span class="header-title">Precursor <span class="tagline">- Learn while you vibecode</span></span>
		<div class="header-spacer"></div>
		<div class="profile-container">
			${profilePicture
				? `<img src="${profilePicture}" alt="Profile" class="profile-picture" id="profileButton">`
				: `<div class="profile-initials" id="profileButton">${initials}</div>`
			}
			<div class="profile-dropdown" id="profileDropdown">
				Hi, ${firstName}
			</div>
		</div>
	</div>

	<!-- Main content -->
	<div class="content">

		<!-- Two-panel layout -->
		<div class="panels-container">
			<!-- Top panel: AI Insights -->
			<div class="panel panel-top">
				<h2 class="panel-title">AI Insights</h2>
				<div class="ai-insights-placeholder">
					<!-- AI Insights content will go here -->
				</div>
			</div>

			<!-- Bottom panel: File Tracking -->
			<div class="panel">
				<h2 class="panel-title">File Tracking</h2>
				${getFileTrackerHTML(files)}
			</div>
		</div>
	</div>

	<!-- Prism.js core and plugins - MUST load before our code -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>

	<script>
		// Global error handler to catch any errors
		window.addEventListener('error', (e) => {
			console.error('[GLOBAL ERROR]', e.message, 'at', e.filename, 'line', e.lineno);
		});

		// VSCode API for communication with extension
		const vscode = acquireVsCodeApi();

		console.log('[HOMEVIEW] Script starting to execute');
		console.log('[HOMEVIEW] Timestamp:', new Date().toISOString());

		// Profile dropdown functionality
		const profileButton = document.getElementById('profileButton');
		const profileDropdown = document.getElementById('profileDropdown');

		// Toggle dropdown when profile is clicked
		profileButton.addEventListener('click', (e) => {
			e.stopPropagation();
			profileDropdown.classList.toggle('show');
		});

		// Close dropdown when clicking anywhere else
		document.addEventListener('click', () => {
			profileDropdown.classList.remove('show');
		});

		// Prevent dropdown from closing when clicking inside it
		profileDropdown.addEventListener('click', (e) => {
			e.stopPropagation();
		});

		// File tracking functionality
		${getFileTrackerJS()}
	</script>
</body>
</html>`;
}
