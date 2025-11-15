import { FileInfo } from './fileTrackerService';

/**
 * Generate HTML and CSS for the file tracker component
 */
export function getFileTrackerHTML(files: FileInfo[]): string {
	return `
		<!-- File list -->
		<div class="file-list">
			<div class="file-list-title">Root Files</div>
			${files.map(file => `
				<div class="file-item">
					<div class="file-name">${file.name}</div>
					<div class="file-preview">${file.firstLine || '(empty file)'}</div>
				</div>
			`).join('')}
			${files.length === 0 ? '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">No files found in root directory</p>' : ''}
		</div>
	`;
}

export function getFileTrackerCSS(): string {
	return `
		/* File list */
		.file-list {
			margin-top: 24px;
		}

		.file-list-title {
			font-size: 12px;
			font-weight: 600;
			color: var(--vscode-descriptionForeground);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 12px;
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
			margin-bottom: 4px;
		}

		.file-preview {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			font-family: var(--vscode-editor-font-family);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`;
}
