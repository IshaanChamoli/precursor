// Main app homepage - shown after user is authenticated
// This is your main product view that will be built out with features
export function getHomeView(firstName: string, logoUri: string): string {
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
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			padding: 20px;
		}

		.home-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 100%;
			max-width: 400px;
		}

		.logo {
			width: 80px;
			height: 80px;
			margin-bottom: 20px;
		}

		.logo img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		.greeting {
			font-size: 28px;
			font-weight: 600;
			margin-bottom: 8px;
			color: var(--vscode-foreground);
		}

		.subtitle {
			font-size: 16px;
			color: var(--vscode-descriptionForeground);
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="home-container">
		<div class="logo">
			<img src="${logoUri}" alt="Precursor Logo">
		</div>

		<h1 class="greeting">Hi, ${firstName}</h1>
		<p class="subtitle">Learn while you vibecode</p>

		<!-- TODO: Add main app features here -->
	</div>
</body>
</html>`;
}
