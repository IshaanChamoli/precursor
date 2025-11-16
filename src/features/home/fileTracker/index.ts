/**
 * File Tracker Feature - Main Entry Point
 * This is the ONLY file that homeView should import from
 * All file tracker internals are hidden behind this interface
 */

import { FileInfo } from './fileTrackerService';
import { getFileListHTML, getFileListCSS, getFileListJS } from './fileTrackerPanel';
import { getFileViewerHTML, getFileViewerCSS } from './fileViewer/fileViewerView';
import { getFileViewerJS } from './fileViewer/fileViewerLogic';
import { getFileTrackerInitJS } from './fileTrackerInit';

/**
 * Get all HTML for the file tracker feature
 */
export function getFileTrackerHTML(files: FileInfo[]): string {
	return `
		${getFileListHTML(files)}
		${getFileViewerHTML()}
	`;
}

/**
 * Get all CSS for the file tracker feature
 */
export function getFileTrackerCSS(): string {
	return `
		${getFileListCSS()}
		${getFileViewerCSS()}
	`;
}

/**
 * Get all JavaScript for the file tracker feature
 * This includes initialization, viewer logic, and list logic in correct order
 */
export function getFileTrackerJS(): string {
	return `
		${getFileTrackerInitJS()}
		${getFileViewerJS()}
		${getFileListJS()}
	`;
}

// Re-export types that homeView needs
export type { FileInfo } from './fileTrackerService';
