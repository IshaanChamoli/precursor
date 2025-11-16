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
	`;
}
