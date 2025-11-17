import { FileInfo } from './fileTrackerService';

/**
 * File Tracker Panel - displays the list of files
 * This is the main view showing all tracked files
 */

/**
 * Generate HTML for the file list
 */
export function getFileListHTML(files: FileInfo[]): string {
	// Create a JSON string of file data to embed in the page
	const filesData = JSON.stringify(files.map(file => ({
		name: file.name,
		path: file.path,
		fullPath: file.fullPath,
		previousSaved: file.previousSaved || null,
		currentSaved: file.currentSaved,
		liveUnsaved: file.liveUnsaved || null,
		isUnsaved: file.isUnsaved || false
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

		<!-- Embedded file data -->
		<script type="application/json" id="filesData">${filesData}</script>
	`;
}

/**
 * Generate CSS for the file list
 */
export function getFileListCSS(): string {
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
	`;
}

/**
 * Generate JavaScript for file list interactions
 */
export function getFileListJS(): string {
	return `
		// File list functionality
		console.log('[FILE LIST] Initializing file list JS');
		console.log('[FILE LIST] filesMap available?', typeof filesMap !== 'undefined');
		console.log('[FILE LIST] filesMap size:', typeof filesMap !== 'undefined' ? filesMap.size : 'N/A');
		console.log('[FILE LIST] fileList available?', typeof fileList !== 'undefined');

		// Handle file item clicks - show file viewer
		if (fileList) {
			fileList.addEventListener('click', (e) => {
				const fileItem = e.target.closest('.file-item');
				if (fileItem) {
					const filePath = fileItem.dataset.filepath;
					console.log('[FILE LIST] File clicked:', filePath);
					showFile(filePath);
				}
			});
			console.log('[FILE LIST] Click listener attached to file list');
		}
	`;
}
