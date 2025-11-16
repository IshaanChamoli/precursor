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

		// Create a map to track ALL open documents (saved and unsaved)
		window.unsavedContentMap = new Map();
		console.log('[FILE TRACKING] Created unsavedContentMap for tracking ALL open documents');

		// Listen for messages from extension (document content updates for ALL files)
		window.addEventListener('message', event => {
			const message = event.data;

			if (message.type === 'documentContent') {
				console.log('[FILE TRACKING] Received document content for:', message.filePath, 'isDirty:', message.isDirty);

				// Store content for ALL files (both saved and unsaved)
				window.unsavedContentMap.set(message.filePath, {
					content: message.content,
					isDirty: message.isDirty
				});

				// Update diff button visibility if this is the currently viewed file
				if (typeof window.diffViewer !== 'undefined') {
					window.diffViewer.updateVisibility(message.filePath);

					// If we're currently viewing this file in diff mode, refresh the diff live!
					window.diffViewer.refreshDiffIfActive(message.filePath);
				}
			} else if (message.type === 'removeUnsavedContent') {
				console.log('[FILE TRACKING] Removing document from tracking:', message.filePath);

				// Remove file from tracking when it's closed
				window.unsavedContentMap.delete(message.filePath);

				// Update diff button visibility if this was the currently viewed file
				if (typeof window.diffViewer !== 'undefined') {
					window.diffViewer.updateVisibility(message.filePath);
				}
			}
		});
		console.log('[FILE TRACKING] Message listener attached - tracking ALL open documents');
	`;
}
