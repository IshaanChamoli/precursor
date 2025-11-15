import { FileInfo } from './fileTrackerService';

/**
 * Generate HTML and CSS for the file tracker component
 */
export function getFileTrackerHTML(files: FileInfo[]): string {
	return `
		<!-- File list -->
		<div class="file-list">
			${files.map(file => `
				<div class="file-item">
					<div class="file-header">
						<div class="file-name">${file.name}</div>
						<div class="file-path">${file.path}</div>
					</div>
					<div class="file-preview">${file.firstLine || '(empty file)'}</div>
				</div>
			`).join('')}
			${files.length === 0 ? '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">No files found in workspace</p>' : ''}
		</div>
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

		.file-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 4px;
		}

		.file-name {
			font-size: 13px;
			font-weight: 500;
			color: var(--vscode-foreground);
		}

		.file-path {
			font-size: 10px;
			color: var(--vscode-descriptionForeground);
			opacity: 0.7;
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
