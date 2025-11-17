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
				<button class="back-button" id="backButton">←</button>
				<div class="file-viewer-title" id="fileViewerTitle"></div>
				${getDiffViewerHTML()}
			</div>
			<div class="code-container">
				<div class="diff-view-label" id="diffViewLabel">Unsaved edits</div>
				<pre class="line-numbers"><code class="file-content" id="fileContent"></code></pre>
			</div>
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
			align-items: center;
			gap: 10px;
			margin-bottom: 12px;
		}

		.file-viewer-title {
			font-size: 13px;
			font-weight: 500;
			color: var(--vscode-foreground);
			flex: 1;
		}

		.back-button {
			background: transparent;
			color: var(--vscode-foreground);
			border: none;
			padding: 4px 6px;
			cursor: pointer;
			font-size: 16px;
			opacity: 0.6;
			transition: opacity 0.2s ease;
			display: flex;
			align-items: center;
			justify-content: center;
			min-width: 24px;
			height: 24px;
		}

		.back-button:hover {
			opacity: 1;
		}

		.code-container {
			position: relative;
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.diff-view-label {
			position: absolute;
			top: 8px;
			right: 4px;
			font-size: 10px;
			color: var(--vscode-descriptionForeground);
			opacity: 0.7;
			z-index: 10;
			background-color: var(--vscode-editor-background);
			padding: 2px 6px;
			border-radius: 3px;
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
