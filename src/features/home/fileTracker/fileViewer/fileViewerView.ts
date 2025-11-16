import { getDiffViewerHTML, getDiffViewerCSS } from './diffViewer';

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
				<div class="file-viewer-actions">
					${getDiffViewerHTML()}
					<button class="back-button" id="backButton">← Back to Files</button>
				</div>
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

		.file-viewer-actions {
			display: flex;
			gap: 8px;
			align-items: center;
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

		/* Let Prism handle layout, we just provide VSCode theme colors */
		pre.line-numbers {
			flex: 1;
			overflow: auto;
			margin: 0;
			padding: 1em;
			background-color: var(--vscode-editor-background) !important;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			font-family: var(--vscode-editor-font-family);
			font-size: var(--vscode-editor-font-size);
			line-height: 1.5;
		}

		pre.line-numbers > code {
			background: transparent !important;
			color: var(--vscode-editor-foreground);
			font-family: inherit;
			font-size: inherit;
		}

		/* Style line numbers with VSCode colors */
		.line-numbers .line-numbers-rows > span {
			color: var(--vscode-editorLineNumber-foreground) !important;
		}

		/* Add border between line numbers and code */
		.line-numbers .line-numbers-rows {
			border-right: 1px solid var(--vscode-panel-border);
		}

		${getDiffViewerCSS()}
	`;
}
