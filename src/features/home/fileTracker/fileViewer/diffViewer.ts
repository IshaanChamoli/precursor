/**
 * Diff Viewer - Shows differences between file versions
 * - Prev: previousSaved vs currentSaved
 * - Now: currentSaved vs liveUnsaved
 */

/**
 * Generate HTML for the Prev/Now toggle switch
 */
export function getDiffViewerHTML(): string {
	return `
		<div class="diff-toggle-container">
			<div class="diff-toggle-switch">
				<input type="radio" id="diffTogglePrev" name="diffView" value="prev">
				<input type="radio" id="diffToggleNow" name="diffView" value="now" checked>
				<label for="diffTogglePrev">Prev</label>
				<label for="diffToggleNow">Now</label>
				<div class="diff-toggle-slider"></div>
			</div>
		</div>
	`;
}

/**
 * Generate CSS for diff viewer
 */
export function getDiffViewerCSS(): string {
	return `
		/* Diff toggle switch container */
		.diff-toggle-container {
			display: flex;
			align-items: center;
		}

		/* Toggle switch */
		.diff-toggle-switch {
			position: relative;
			display: inline-flex;
			background-color: var(--vscode-button-secondaryBackground);
			border-radius: 12px;
			padding: 2px;
			width: 90px;
			height: 24px;
		}

		.diff-toggle-switch input[type="radio"] {
			display: none;
		}

		.diff-toggle-switch label {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 11px;
			font-weight: 500;
			cursor: pointer;
			z-index: 2;
			transition: color 0.2s ease;
			color: var(--vscode-button-secondaryForeground);
		}

		.diff-toggle-switch input[type="radio"]:checked + label {
			color: var(--vscode-button-foreground);
		}

		.diff-toggle-slider {
			position: absolute;
			top: 2px;
			left: 2px;
			width: calc(50% - 2px);
			height: calc(100% - 4px);
			background-color: var(--vscode-button-background);
			border-radius: 10px;
			transition: transform 0.2s ease;
			z-index: 1;
		}

		.diff-toggle-switch input[value="now"]:checked ~ .diff-toggle-slider {
			transform: translateX(100%);
		}

		/* Diff highlighting - using Prism diff-highlight plugin styles */
		.token.deleted {
			background-color: rgba(255, 0, 0, 0.1);
		}

		.token.inserted {
			background-color: rgba(0, 255, 0, 0.1);
		}

		/* Line-level diff backgrounds */
		.line-deleted {
			background-color: rgba(255, 0, 0, 0.15) !important;
		}

		.line-inserted {
			background-color: rgba(0, 255, 0, 0.15) !important;
		}
	`;
}

/**
 * Generate JavaScript for diff viewer functionality
 */
export function getDiffViewerJS(): string {
	return `
		// Diff viewer functionality
		console.log('[DIFF VIEWER] Initializing diff viewer JS');

		const diffTogglePrev = document.getElementById('diffTogglePrev');
		const diffToggleNow = document.getElementById('diffToggleNow');
		const diffViewLabel = document.getElementById('diffViewLabel');

		let currentFilePath = null;
		let currentView = 'now'; // 'prev' or 'now'

		/**
		 * Generate unified diff format from two text strings
		 */
		function generateDiff(oldText, newText, language) {

			// Simple line-by-line diff
			const oldLines = (oldText || '').split('\\n');
			const newLines = (newText || '').split('\\n');

			let diffOutput = '';
			const maxLines = Math.max(oldLines.length, newLines.length);

			for (let i = 0; i < maxLines; i++) {
				const oldLine = oldLines[i] || '';
				const newLine = newLines[i] || '';

				if (oldLine === newLine) {
					// Unchanged line
					diffOutput += '  ' + oldLine + '\\n';
				} else {
					// Changed line - show both
					if (oldLine) {
						diffOutput += '- ' + oldLine + '\\n';
					}
					if (newLine) {
						diffOutput += '+ ' + newLine + '\\n';
					}
				}
			}

			return diffOutput;
		}

		/**
		 * Show Prev view: previousSaved vs currentSaved
		 */
		function showPrevView() {
			if (!currentFilePath) {
				return;
			}

			const versions = window.fileVersionsMap?.get(currentFilePath);
			if (!versions) {
				return;
			}

			const file = filesMap.get(currentFilePath);
			if (!file) {
				return;
			}

			// Detect language
			const parts = file.name.split('.');
			const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
			const language = languageMap[extension] || 'plaintext';

			// Generate diff: previousSaved vs currentSaved
			const prevContent = versions.previousSaved || '';
			const currentContent = versions.currentSaved || '';

			const diffText = generateDiff(prevContent, currentContent, language);

			// Update display
			fileContent.textContent = diffText;
			fileContent.className = 'file-content language-diff-' + language;

			// Update label
			if (diffViewLabel) {
				diffViewLabel.textContent = 'Edits made by most recent save';
			}

			// Apply Prism syntax highlighting
			if (typeof Prism !== 'undefined') {
				const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
				if (existingLineNumbers) {
					existingLineNumbers.remove();
				}
				Prism.highlightElement(fileContent);
			}
		}

		/**
		 * Show Now view: currentSaved vs liveUnsaved
		 */
		function showNowView() {
			if (!currentFilePath) {
				return;
			}

			const versions = window.fileVersionsMap?.get(currentFilePath);
			if (!versions) {
				return;
			}

			const file = filesMap.get(currentFilePath);
			if (!file) {
				return;
			}

			// Detect language
			const parts = file.name.split('.');
			const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
			const language = languageMap[extension] || 'plaintext';

			// Generate diff: currentSaved vs liveUnsaved
			const currentContent = versions.currentSaved || '';
			const liveContent = versions.liveUnsaved || currentContent; // If no unsaved, show current
			const diffText = generateDiff(currentContent, liveContent, language);

			// Check if there are any actual changes
			const hasChanges = liveContent !== currentContent;

			// Update display
			fileContent.textContent = diffText;
			fileContent.className = 'file-content language-diff-' + language;

			// Update label
			if (diffViewLabel) {
				diffViewLabel.textContent = hasChanges ? 'Unsaved edits' : 'No unsaved edits';
			}

			// Apply Prism syntax highlighting
			if (typeof Prism !== 'undefined') {
				const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
				if (existingLineNumbers) {
					existingLineNumbers.remove();
				}
				Prism.highlightElement(fileContent);
			}
		}

		/**
		 * Handle toggle switch changes
		 */
		if (diffTogglePrev) {
			diffTogglePrev.addEventListener('change', () => {
				if (diffTogglePrev.checked) {
					currentView = 'prev';
					showPrevView();
				}
			});
		}

		if (diffToggleNow) {
			diffToggleNow.addEventListener('change', () => {
				if (diffToggleNow.checked) {
					currentView = 'now';
					showNowView();
				}
			});
		}

		console.log('[DIFF VIEWER] Toggle switch listeners attached');

		/**
		 * Refresh the current view if this file is active
		 * Called when file content updates
		 */
		function refreshIfActive(filePath) {
			if (currentFilePath !== filePath) {
				return; // Not viewing this file
			}

			// Refresh whichever view is currently active
			if (currentView === 'prev') {
				showPrevView();
			} else {
				showNowView();
			}
		}

		/**
		 * Set the current file and show default view
		 */
		function setCurrentFile(filePath) {
			currentFilePath = filePath;

			// Default to Now view
			currentView = 'now';
			diffToggleNow.checked = true;

			showNowView();
		}

		/**
		 * Expose functions for file viewer to call
		 */
		window.diffViewer = {
			refreshIfActive: refreshIfActive,
			setCurrentFile: setCurrentFile
		};
	`;
}
