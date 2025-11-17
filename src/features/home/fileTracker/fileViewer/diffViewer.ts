/**
 * Diff Viewer - Shows differences between saved and unsaved file versions
 * Uses diff-match-patch for computation and Prism.js for visualization
 */

/**
 * Generate HTML for the diff toggle button
 */
export function getDiffViewerHTML(): string {
	return `
		<button class="diff-toggle-button" id="diffToggleButton" style="display: none;">
			<span id="diffToggleIcon">📝</span>
			<span id="diffToggleText">Show Unsaved</span>
		</button>
	`;
}

/**
 * Generate CSS for diff viewer
 */
export function getDiffViewerCSS(): string {
	return `
		/* Diff toggle button */
		.diff-toggle-button {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			padding: 4px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.diff-toggle-button:hover:not(:disabled) {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		.diff-toggle-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
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

		/* Diff view indicator */
		.diff-mode-indicator {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			margin-left: 8px;
			opacity: 0.7;
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

		const diffToggleButton = document.getElementById('diffToggleButton');
		const diffToggleIcon = document.getElementById('diffToggleIcon');
		const diffToggleText = document.getElementById('diffToggleText');

		let isShowingUnsaved = false; // false = showing saved, true = showing unsaved
		let currentFilePath = null;
		let savedContent = null; // Store saved content for reference

		// Initialize unsaved content map if it doesn't exist
		if (!window.unsavedContentMap) {
			window.unsavedContentMap = new Map();
		}

		/**
		 * Generate unified diff format from two text strings
		 * Uses simple line-by-line comparison (we'll use diff-match-patch in production)
		 */
		function generateDiff(oldText, newText, language) {
			console.log('[DIFF VIEWER] Generating diff');

			// For now, simple line-by-line diff
			// TODO: Replace with diff-match-patch for better diffs
			const oldLines = oldText.split('\\n');
			const newLines = newText.split('\\n');

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
		 * Toggle between showing saved and unsaved content
		 */
		function toggleDiffMode() {
			console.log('[DIFF VIEWER] Toggling view mode, currently showing:', isShowingUnsaved ? 'unsaved' : 'saved');

			if (!currentFilePath) {
				console.warn('[DIFF VIEWER] No file currently open');
				return;
			}

			const file = filesMap.get(currentFilePath);
			if (!file) {
				console.warn('[DIFF VIEWER] File not found in filesMap');
				return;
			}

			isShowingUnsaved = !isShowingUnsaved;

			if (isShowingUnsaved) {
				// Switch to showing unsaved content (in diff style)
				console.log('[DIFF VIEWER] Switching to show unsaved content in diff style');

				// Store saved content for reference
				savedContent = file.content || '';

				// Detect language
				const parts = file.name.split('.');
				const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				const language = languageMap[extension] || 'plaintext';

				// Get unsaved content
				const unsavedData = window.unsavedContentMap.get(currentFilePath);
				const unsavedContent = unsavedData ? unsavedData.content : savedContent;

				// Generate diff (saved vs unsaved) to show changes
				const diffText = generateDiff(savedContent, unsavedContent, language);

				// Update display
				fileContent.textContent = diffText;
				fileContent.className = 'file-content language-diff-' + language;

				// Apply Prism syntax highlighting with diff
				if (typeof Prism !== 'undefined') {
					const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
					if (existingLineNumbers) {
						existingLineNumbers.remove();
					}
					Prism.highlightElement(fileContent);
				}

				// Update button to show "Show Last Saved"
				diffToggleIcon.textContent = '💾';
				diffToggleText.textContent = 'Show Last Saved';

			} else {
				// Switch back to showing saved content
				console.log('[DIFF VIEWER] Switching to show saved content');

				// Show saved content from file
				fileContent.textContent = file.content || '';

				const parts = file.name.split('.');
				const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				const language = languageMap[extension] || 'plaintext';
				fileContent.className = 'file-content language-' + language;

				// Apply Prism syntax highlighting
				if (typeof Prism !== 'undefined') {
					const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
					if (existingLineNumbers) {
						existingLineNumbers.remove();
					}
					Prism.highlightElement(fileContent);
				}

				// Update button to show "Show Unsaved"
				diffToggleIcon.textContent = '📝';
				diffToggleText.textContent = 'Show Unsaved';
			}
		}

		// Attach click handler to diff toggle button
		if (diffToggleButton) {
			diffToggleButton.addEventListener('click', toggleDiffMode);
			console.log('[DIFF VIEWER] Diff toggle button listener attached');
		}

		/**
		 * Check if file has unsaved changes and update button state
		 */
		function updateDiffButtonVisibility(filePath) {
			console.log('[DIFF VIEWER] Updating diff button visibility for:', filePath);
			console.log('[DIFF VIEWER] currentFilePath before update:', currentFilePath);

			if (!filePath) {
				diffToggleButton.style.display = 'none';
				return;
			}

			const file = filesMap.get(filePath);
			if (!file) {
				diffToggleButton.style.display = 'none';
				return;
			}

			// Update currentFilePath if this is being called for a different file
			// This ensures the toggle button always works for the currently viewed file
			if (currentFilePath !== filePath) {
				console.log('[DIFF VIEWER] Updating currentFilePath from', currentFilePath, 'to', filePath);
				currentFilePath = filePath;
			}

			// Check if we have unsaved content for this file
			const unsavedData = window.unsavedContentMap?.get(filePath);
			if (unsavedData && unsavedData.isDirty) {
				// Show button enabled when file has unsaved changes
				diffToggleButton.style.display = 'flex';
				diffToggleButton.disabled = false;
				diffToggleButton.style.opacity = '1';
				diffToggleButton.style.cursor = 'pointer';
				console.log('[DIFF VIEWER] Diff button shown and enabled (unsaved changes detected)');
			} else {
				// Show button but disabled when no unsaved changes
				diffToggleButton.style.display = 'flex';
				diffToggleButton.disabled = true;
				diffToggleButton.style.opacity = '0.5';
				diffToggleButton.style.cursor = 'not-allowed';

				// If we were showing unsaved, automatically switch to saved view
				if (isShowingUnsaved && currentFilePath === filePath) {
					console.log('[DIFF VIEWER] Auto-switching to saved view (file was saved)');
					// Show saved content from file
					fileContent.textContent = file.content || '';

					const parts = file.name.split('.');
					const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
					const language = languageMap[extension] || 'plaintext';
					fileContent.className = 'file-content language-' + language;

					// Apply Prism syntax highlighting
					if (typeof Prism !== 'undefined') {
						const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
						if (existingLineNumbers) {
							existingLineNumbers.remove();
						}
						Prism.highlightElement(fileContent);
					}

					// Update state and button
					isShowingUnsaved = false;
					savedContent = null;
					diffToggleIcon.textContent = '📝';
					diffToggleText.textContent = 'Show Unsaved';
				}

				console.log('[DIFF VIEWER] Diff button shown but disabled (no unsaved changes)');
			}
		}

		/**
		 * Refresh the unsaved view if currently active for this file
		 * Called automatically when new content arrives while showing unsaved
		 */
		function refreshDiffIfActive(filePath) {
			// Only refresh if we're showing unsaved content and viewing this file
			if (!isShowingUnsaved || currentFilePath !== filePath) {
				return;
			}

			console.log('[DIFF VIEWER] Live refresh triggered for:', filePath);

			const file = filesMap.get(filePath);
			if (!file) {
				return;
			}

			// Detect language
			const parts = file.name.split('.');
			const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
			const language = languageMap[extension] || 'plaintext';

			// Get latest unsaved content
			const unsavedData = window.unsavedContentMap.get(filePath);
			const unsavedContent = unsavedData ? unsavedData.content : file.content;

			// Regenerate diff with latest content (saved vs unsaved)
			const diffText = generateDiff(file.content || '', unsavedContent || '', language);

			// Update display
			fileContent.textContent = diffText;
			fileContent.className = 'file-content language-diff-' + language;

			// Re-apply Prism syntax highlighting
			if (typeof Prism !== 'undefined') {
				const existingLineNumbers = fileContentPre.querySelector('.line-numbers-rows');
				if (existingLineNumbers) {
					existingLineNumbers.remove();
				}
				Prism.highlightElement(fileContent);
			}

			console.log('[DIFF VIEWER] Unsaved view refreshed live!');
		}

		/**
		 * Expose functions for file viewer to call
		 */
		window.diffViewer = {
			updateVisibility: updateDiffButtonVisibility,
			refreshDiffIfActive: refreshDiffIfActive,
			setCurrentFile: (filePath) => {
				currentFilePath = filePath;
				isShowingUnsaved = false;
				savedContent = null;
				diffToggleIcon.textContent = '📝';
				diffToggleText.textContent = 'Show Unsaved';
			}
		};

		console.log('[DIFF VIEWER] Diff viewer initialized');
	`;
}
