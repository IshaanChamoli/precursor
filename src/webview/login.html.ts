// Login UI HTML
export function getLoginHtml(logoUri: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Precursor - Login</title>
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

		.login-container {
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

		h1 {
			font-size: 32px;
			font-weight: 600;
			margin-bottom: 8px;
			color: var(--vscode-foreground);
		}

		.subtitle {
			font-size: 16px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 40px;
			text-align: center;
		}

		.login-button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 12px 32px;
			font-size: 14px;
			font-weight: 500;
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.2s;
			width: 100%;
			max-width: 200px;
		}

		.login-button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.login-button:active {
			transform: translateY(1px);
		}
	</style>
</head>
<body>
	<div class="login-container">
		<div class="logo">
			<img src="${logoUri}" alt="Precursor Logo" id="logoImg">
		</div>

		<h1>Precursor</h1>
		<p class="subtitle">Learn while you vibecode</p>

		<button class="login-button" id="loginBtn">Log in</button>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		// Handle login button click
		document.getElementById('loginBtn').addEventListener('click', () => {
			vscode.postMessage({
				command: 'login'
			});
		});
	</script>
</body>
</html>`;
}
