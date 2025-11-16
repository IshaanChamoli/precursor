import { getDiffViewerJS } from './diffViewer';

/**
 * File Viewer Logic - handles syntax highlighting and interactions
 * Contains all JavaScript for the file viewer component
 */

/**
 * Generate JavaScript for file viewer functionality
 */
export function getFileViewerJS(): string {
	return `
		// File viewer functionality
		console.log('[FILE VIEWER] Initializing file viewer JS');
		const fileViewerTitle = document.getElementById('fileViewerTitle');
		const fileContent = document.getElementById('fileContent');
		const fileContentPre = fileContent ? fileContent.parentElement : null;
		const backButton = document.getElementById('backButton');

		// Get or initialize VSCode state
		const state = vscode.getState() || { viewingFile: null };
		console.log('[FILE VIEWER] Retrieved state:', state);

		// Language detection map for Prism.js
		const languageMap = {
			'js': 'javascript',
			'jsx': 'jsx',
			'ts': 'typescript',
			'tsx': 'tsx',
			'py': 'python',
			'java': 'java',
			'c': 'c',
			'cpp': 'cpp',
			'cs': 'csharp',
			'php': 'php',
			'rb': 'ruby',
			'go': 'go',
			'rs': 'rust',
			'swift': 'swift',
			'kt': 'kotlin',
			'scala': 'scala',
			'sh': 'bash',
			'bash': 'bash',
			'zsh': 'bash',
			'json': 'json',
			'xml': 'xml',
			'html': 'html',
			'css': 'css',
			'scss': 'scss',
			'sass': 'sass',
			'less': 'less',
			'sql': 'sql',
			'md': 'markdown',
			'yaml': 'yaml',
			'yml': 'yaml',
			'toml': 'toml',
			'ini': 'ini',
			'dockerfile': 'docker',
			'vue': 'vue',
			'svelte': 'svelte'
		};

		// Function to show a file in the viewer
		function showFile(filePath) {
			console.log('[FILE VIEWER] showFile() called with path:', filePath);
			console.log('[FILE VIEWER] typeof filesMap:', typeof filesMap);
			console.log('[FILE VIEWER] filesMap exists?', typeof filesMap !== 'undefined');

			if (typeof filesMap === 'undefined') {
				console.error('[FILE VIEWER] ERROR: filesMap is undefined!');
				return;
			}

			const file = filesMap.get(filePath);
			console.log('[FILE VIEWER] Retrieved file:', file ? file.name : 'NOT FOUND');

			if (file) {
				fileViewerTitle.textContent = file.name;

				// Detect language from file extension
				const parts = file.name.split('.');
				const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				const language = languageMap[extension] || 'plaintext';
				console.log('[FILE VIEWER] Detected language:', language);

				// Set content and language class
				fileContent.textContent = file.content;
				fileContent.className = 'file-content language-' + language;

				// Show the viewer
				fileList.style.display = 'none';
				fileViewer.style.display = 'flex';
				console.log('[FILE VIEWER] Switched to file viewer display');

				// Apply Prism syntax highlighting
				if (typeof Prism !== 'undefined') {
					// Remove old line numbers if they exist
					const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
					if (existingLineNumbers) {
						existingLineNumbers.remove();
					}

					// Highlight the code (this should trigger line numbers automatically)
					Prism.highlightElement(fileContent);
					console.log('[FILE VIEWER] Applied Prism highlighting');
				}

				// Notify diff viewer about current file
				if (typeof window.diffViewer !== 'undefined') {
					window.diffViewer.setCurrentFile(filePath);
					window.diffViewer.updateVisibility(filePath);
				}

				// Save state
				vscode.setState({ viewingFile: filePath });
				console.log('[FILE VIEWER] Saved state with viewingFile:', filePath);
			}
		}

		// If we were viewing a file before refresh, restore it with updated content
		console.log('[FILE VIEWER] Checking if should restore view...');
		console.log('[FILE VIEWER] state.viewingFile:', state.viewingFile);
		console.log('[FILE VIEWER] typeof filesMap at restore check:', typeof filesMap);

		if (state.viewingFile) {
			if (typeof filesMap === 'undefined') {
				console.error('[FILE VIEWER] ERROR: Cannot restore view - filesMap is undefined!');
			} else if (filesMap.has(state.viewingFile)) {
				console.log('[FILE VIEWER] Restoring view for file:', state.viewingFile);
				showFile(state.viewingFile);
			} else {
				console.warn('[FILE VIEWER] File not found in filesMap:', state.viewingFile);
			}
		} else {
			console.log('[FILE VIEWER] No file to restore, showing file list');
		}

		// Handle back button click
		if (backButton) {
			backButton.addEventListener('click', () => {
				console.log('[FILE VIEWER] Back button clicked');
				fileViewer.style.display = 'none';
				fileList.style.display = 'block';

				// Clear state
				vscode.setState({ viewingFile: null });
				console.log('[FILE VIEWER] Cleared state and returned to file list');
			});
		}

		${getDiffViewerJS()}
	`;
}
