/**
 * File Viewer - displays a single opened file with syntax highlighting
 * This component shows when a user clicks on a file from the list
 */

/**
 * Generate HTML for the file viewer
 */
export function getFileViewerHTML(): string {
	return `
		<!-- File viewer (hidden by default) -->
		<div class="file-viewer" id="fileViewer" style="display: none;">
			<div class="file-viewer-header">
				<div class="file-viewer-title" id="fileViewerTitle"></div>
				<button class="back-button" id="backButton">← Back to Files</button>
			</div>
			<pre class="line-numbers"><code class="file-content" id="fileContent"></code></pre>
		</div>
	`;
}

/**
 * Generate CSS for the file viewer
 */
export function getFileViewerCSS(): string {
	return `
		/* File viewer */
		.file-viewer {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.file-viewer-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12px;
		}

		.file-viewer-title {
			font-size: 13px;
			font-weight: 500;
			color: var(--vscode-foreground);
		}

		.back-button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 4px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
		}

		.back-button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.file-content {
			display: block;
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 12px;
			font-family: var(--vscode-editor-font-family);
			font-size: var(--vscode-editor-font-size);
			line-height: 1.5;
			color: var(--vscode-editor-foreground);
			margin: 0;
			overflow: auto;
		}

		/* Ensure Prism styles work with VSCode theme */
		pre.line-numbers {
			flex: 1;
			overflow: auto;
			margin: 0;
			padding: 0;
			background: transparent !important;
		}

		pre.line-numbers > code {
			background: transparent !important;
		}

		/* Adjust line number styles to match VSCode */
		.line-numbers .line-numbers-rows {
			border-right: 1px solid var(--vscode-panel-border);
		}
	`;
}
