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
		const fileViewer = document.getElementById('fileViewer');
		const fileViewerTitle = document.getElementById('fileViewerTitle');
		const fileContent = document.getElementById('fileContent');
		const fileContentPre = fileContent ? fileContent.parentElement : null;
		const backButton = document.getElementById('backButton');

		// Get or initialize VSCode state
		const state = vscode.getState() || { viewingFile: null };

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
			const file = filesMap.get(filePath);
			if (file) {
				fileViewerTitle.textContent = file.name;

				// Detect language from file extension
				const parts = file.name.split('.');
				const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				const language = languageMap[extension] || 'plaintext';

				// Set content and language class
				fileContent.textContent = file.content;
				fileContent.className = 'file-content language-' + language;

				// Show the viewer
				fileList.style.display = 'none';
				fileViewer.style.display = 'flex';

				// Apply Prism syntax highlighting
				if (typeof Prism !== 'undefined') {
					// Remove old line numbers if they exist
					const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
					if (existingLineNumbers) {
						existingLineNumbers.remove();
					}

					// Highlight the code (this should trigger line numbers automatically)
					Prism.highlightElement(fileContent);
				}

				// Save state
				vscode.setState({ viewingFile: filePath });
			}
		}

		// If we were viewing a file before refresh, restore it with updated content
		if (state.viewingFile && filesMap.has(state.viewingFile)) {
			showFile(state.viewingFile);
		}

		// Handle back button click
		if (backButton) {
			backButton.addEventListener('click', () => {
				fileViewer.style.display = 'none';
				fileList.style.display = 'block';

				// Clear state
				vscode.setState({ viewingFile: null });
			});
		}
	`;
}
