import { FileInfo } from './fileTrackerService';

/**
 * Generate HTML and CSS for the file tracker component
 */
export function getFileTrackerHTML(files: FileInfo[]): string {
	// Create a JSON string of file data to embed in the page
	const filesData = JSON.stringify(files.map(file => ({
		name: file.name,
		path: file.path,
		fullPath: file.fullPath,
		content: file.content
	})));

	return `
		<!-- File list view -->
		<div class="file-list" id="fileList">
			${files.map(file => `
				<div class="file-item" data-filepath="${file.fullPath}">
					<div class="file-name">${file.name}</div>
					<div class="file-path">${file.path}</div>
				</div>
			`).join('')}
			${files.length === 0 ? '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">No files found in workspace</p>' : ''}
		</div>

		<!-- File viewer (hidden by default) -->
		<div class="file-viewer" id="fileViewer" style="display: none;">
			<div class="file-viewer-header">
				<div class="file-viewer-title" id="fileViewerTitle"></div>
				<button class="back-button" id="backButton">← Back to Files</button>
			</div>
			<pre class="file-content" id="fileContent"></pre>
		</div>

		<!-- Embedded file data -->
		<script type="application/json" id="filesData">${filesData}</script>
	`;
}

export function getFileTrackerCSS(): string {
	return `
		/* File list */
		.file-list {
			flex: 1;
			overflow-y: auto;
		}

		.file-item {
			padding: 10px 12px;
			margin-bottom: 6px;
			background-color: var(--vscode-list-hoverBackground);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.1s ease;
		}

		.file-item:hover {
			background-color: var(--vscode-list-activeSelectionBackground);
		}

		.file-name {
			font-size: 13px;
			font-weight: 500;
			color: var(--vscode-foreground);
			margin-bottom: 2px;
		}

		.file-path {
			font-size: 10px;
			color: var(--vscode-descriptionForeground);
			opacity: 0.7;
		}

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
			flex: 1;
			overflow: auto;
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 12px;
			font-family: var(--vscode-editor-font-family);
			font-size: var(--vscode-editor-font-size);
			line-height: 1.5;
			color: var(--vscode-editor-foreground);
			margin: 0;
		}
	`;
}
