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
			<span id="diffToggleIcon">🔀</span>
			<span id="diffToggleText">Show Diff</span>
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

		.diff-toggle-button:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
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

		let isDiffMode = false;
		let currentFilePath = null;
		let originalContent = null; // Store original content when in diff mode

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
		 * Toggle between normal view and diff view
		 */
		function toggleDiffMode() {
			console.log('[DIFF VIEWER] Toggling diff mode, current:', isDiffMode);

			if (!currentFilePath) {
				console.warn('[DIFF VIEWER] No file currently open');
				return;
			}

			const file = filesMap.get(currentFilePath);
			if (!file) {
				console.warn('[DIFF VIEWER] File not found in filesMap');
				return;
			}

			isDiffMode = !isDiffMode;

			if (isDiffMode) {
				// Switch to diff mode
				console.log('[DIFF VIEWER] Switching to diff mode');

				// Store original content
				originalContent = fileContent.textContent;

				// Detect language
				const parts = file.name.split('.');
				const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
				const language = languageMap[extension] || 'plaintext';

				// Get unsaved content for comparison
				const unsavedData = window.unsavedContentMap.get(currentFilePath);
				const unsavedContent = unsavedData ? unsavedData.content : originalContent;

				// Generate diff (saved vs unsaved)
				const diffText = generateDiff(file.content || '', unsavedContent || '', language);

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

				// Update button
				diffToggleIcon.textContent = '📝';
				diffToggleText.textContent = 'Show Code';

			} else {
				// Switch back to normal mode
				console.log('[DIFF VIEWER] Switching to normal mode');

				// Restore original content
				if (originalContent) {
					fileContent.textContent = originalContent;

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
				}

				// Update button
				diffToggleIcon.textContent = '🔀';
				diffToggleText.textContent = 'Show Diff';
			}
		}

		// Attach click handler to diff toggle button
		if (diffToggleButton) {
			diffToggleButton.addEventListener('click', toggleDiffMode);
			console.log('[DIFF VIEWER] Diff toggle button listener attached');
		}

		/**
		 * Check if file has unsaved changes and show/hide diff button
		 */
		function updateDiffButtonVisibility(filePath) {
			console.log('[DIFF VIEWER] Updating diff button visibility for:', filePath);

			if (!filePath) {
				diffToggleButton.style.display = 'none';
				return;
			}

			const file = filesMap.get(filePath);
			if (!file) {
				diffToggleButton.style.display = 'none';
				return;
			}

			// Check if we have unsaved content for this file
			const unsavedData = window.unsavedContentMap?.get(filePath);
			if (unsavedData && unsavedData.isDirty) {
				// Show diff button when file has unsaved changes
				diffToggleButton.style.display = 'flex';
				console.log('[DIFF VIEWER] Diff button shown (unsaved changes detected)');
			} else {
				// Hide diff button when no unsaved changes
				diffToggleButton.style.display = 'none';
				console.log('[DIFF VIEWER] Diff button hidden (no unsaved changes)');
			}
		}

		/**
		 * Refresh the diff view if currently active for this file
		 * Called automatically when new content arrives while in diff mode
		 */
		function refreshDiffIfActive(filePath) {
			// Only refresh if we're in diff mode and viewing this file
			if (!isDiffMode || currentFilePath !== filePath) {
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

			// Regenerate diff with latest content
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

			console.log('[DIFF VIEWER] Diff refreshed live!');
		}

		/**
		 * Expose functions for file viewer to call
		 */
		window.diffViewer = {
			updateVisibility: updateDiffButtonVisibility,
			refreshDiffIfActive: refreshDiffIfActive,
			setCurrentFile: (filePath) => {
				currentFilePath = filePath;
				isDiffMode = false;
				originalContent = null;
				diffToggleIcon.textContent = '🔀';
				diffToggleText.textContent = 'Show Diff';
			}
		};

		console.log('[DIFF VIEWER] Diff viewer initialized');
	`;
}
