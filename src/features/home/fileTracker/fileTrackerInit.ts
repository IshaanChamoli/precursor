/**
 * File Tracker Initialization
 * Shared initialization code that must run before file viewer and file list
 * Creates the filesMap that both components depend on
 */

/**
 * Generate JavaScript initialization code for file tracking
 * This MUST be called before getFileViewerJS() and getFileListJS()
 */
export function getFileTrackerInitJS(): string {
	return `
		// File tracking initialization
		console.log('[FILE TRACKING] Loading shared file data');

		// Get DOM elements (shared between file list and file viewer)
		const fileList = document.getElementById('fileList');
		const fileViewer = document.getElementById('fileViewer');
		console.log('[FILE TRACKING] Got DOM elements - fileList:', !!fileList, 'fileViewer:', !!fileViewer);

		// Load file data from embedded JSON
		const filesDataElement = document.getElementById('filesData');
		const filesData = filesDataElement ? JSON.parse(filesDataElement.textContent) : [];
		console.log('[FILE TRACKING] Loaded file data, count:', filesData.length);

		// Create a map for quick file lookup (shared between file list and file viewer)
		const filesMap = new Map();
		filesData.forEach(file => {
			filesMap.set(file.fullPath, file);
		});
		console.log('[FILE TRACKING] Created shared filesMap with', filesMap.size, 'entries');

		// Create unified map to track all three states for each file:
		// - previousSaved: Content from the save before the current one
		// - currentSaved: Content from the most recent save (embedded in filesMap)
		// - liveUnsaved: Live content being edited right now (tracked via messages)
		window.fileVersionsMap = new Map();
		filesData.forEach(file => {
			window.fileVersionsMap.set(file.fullPath, {
				previousSaved: file.previousSaved || null,
				currentSaved: file.currentSaved || null,
				liveUnsaved: file.liveUnsaved || null
			});
		});
		console.log('[FILE TRACKING] Created unified fileVersionsMap with', window.fileVersionsMap.size, 'entries');

		// Listen for messages from extension (document content updates for ALL files)
		window.addEventListener('message', event => {
			const message = event.data;

			if (message.type === 'documentContent') {
				console.log('[FILE TRACKING] Received document content for:', message.filePath, 'isDirty:', message.isDirty, 'isUntitled:', message.isUntitled);

				// Get or create file version entry
				if (!window.fileVersionsMap.has(message.filePath)) {
					window.fileVersionsMap.set(message.filePath, {
						previousSaved: null,
						currentSaved: null,
						liveUnsaved: null
					});
				}

				// If this is a NEW file (not in filesMap), add it to the list
				if (!filesMap.has(message.filePath)) {
					const fileName = message.filePath.split('/').pop() || message.filePath;
					const isUnsaved = message.isUntitled || message.filePath.startsWith('[unsaved]/');

					filesMap.set(message.filePath, {
						name: fileName,
						path: isUnsaved ? '[unsaved]' : 'root',
						fullPath: message.filePath,
						currentSaved: '',
						previousSaved: null,
						isUnsaved: isUnsaved
					});

					// Add to file list UI
					const fileListElement = document.getElementById('fileList');
					if (fileListElement) {
						const fileItem = document.createElement('div');
						fileItem.className = 'file-item';
						fileItem.dataset.filepath = message.filePath;
						fileItem.innerHTML = \`
							<div class="file-name">\${fileName}</div>
							<div class="file-path">\${isUnsaved ? '[unsaved]' : 'root'}</div>
						\`;
						fileListElement.insertBefore(fileItem, fileListElement.firstChild);
						console.log('[FILE TRACKING] Added new file to list:', message.filePath);
					}
				}

				const versions = window.fileVersionsMap.get(message.filePath);

				if (message.isDirty) {
					// File has unsaved changes → update liveUnsaved
					versions.liveUnsaved = message.content;
					console.log('[FILE TRACKING] ========== Updated liveUnsaved for:', message.filePath, '==========');
					console.log('[FILE TRACKING - STATE] previousSaved:', versions.previousSaved || '[EMPTY/NULL]');
					console.log('[FILE TRACKING - STATE] currentSaved:', versions.currentSaved || '[EMPTY/NULL]');
					console.log('[FILE TRACKING - STATE] liveUnsaved:', versions.liveUnsaved || '[EMPTY/NULL]');
				} else {
					// isDirty = false means either:
					// 1) File was just saved (transition states)
					// 2) File is being opened/initialized (don't transition yet)

					// Only transition if we actually HAD unsaved content before
					// A save can only happen if there was something to save!
					const hadUnsavedContent = versions.liveUnsaved !== null;

					console.log('[FILE TRACKING] ========== isDirty=false for:', message.filePath, '==========');
					console.log('[FILE TRACKING - DECISION] hadUnsavedContent:', hadUnsavedContent);

					if (hadUnsavedContent) {
						console.log('[FILE TRACKING] ========== BEFORE STATE TRANSITION ==========');
						console.log('[FILE TRACKING - STATE] previousSaved:', versions.previousSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] currentSaved:', versions.currentSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] liveUnsaved:', versions.liveUnsaved || '[EMPTY/NULL]');

						// File was just saved → transition states
						// currentSaved → previousSaved
						// liveUnsaved (or new content) → currentSaved
						// liveUnsaved → null
						versions.previousSaved = versions.currentSaved;
						versions.currentSaved = message.content;
						versions.liveUnsaved = null;

						console.log('[FILE TRACKING] ========== AFTER STATE TRANSITION ==========');
						console.log('[FILE TRACKING - STATE] previousSaved:', versions.previousSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] currentSaved:', versions.currentSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] liveUnsaved:', versions.liveUnsaved || '[EMPTY/NULL]');

						// Update filesMap with the new saved content
						const file = filesMap.get(message.filePath);
						if (file) {
							file.currentSaved = message.content;
						}

						console.log('[FILE TRACKING] File saved! Transitioned states for:', message.filePath);
					} else {
						console.log('[FILE TRACKING] File opened/initialized (not a save):', message.filePath);
						console.log('[FILE TRACKING - STATE] previousSaved:', versions.previousSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] currentSaved:', versions.currentSaved || '[EMPTY/NULL]');
						console.log('[FILE TRACKING - STATE] liveUnsaved:', versions.liveUnsaved || '[EMPTY/NULL]');
					}
				}

				// Refresh diff viewer if this file is currently being viewed
				if (typeof window.diffViewer !== 'undefined') {
					window.diffViewer.refreshIfActive(message.filePath);
				}
			} else if (message.type === 'removeUnsavedContent') {
				console.log('[FILE TRACKING] Removing document from tracking:', message.filePath);

				// Clear liveUnsaved when document is closed
				const versions = window.fileVersionsMap.get(message.filePath);
				if (versions) {
					versions.liveUnsaved = null;
				}
			}
		});
		console.log('[FILE TRACKING] Message listener attached - tracking ALL states (prev/current/live)');
	`;
}
