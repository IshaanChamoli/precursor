import * as vscode from 'vscode';

export interface FileInfo {
	name: string;
	firstLine: string;
}

export class FileTrackerService {
	/**
	 * Get all files in the root directory (not in subdirectories)
	 * and read the first line of each file
	 */
	async getRootFiles(): Promise<FileInfo[]> {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}

		const rootPath = workspaceFolders[0].uri;
		const files = await vscode.workspace.fs.readDirectory(rootPath);

		// Filter to only files (not directories) and read first line of each
		const fileList: FileInfo[] = [];
		for (const [name, type] of files) {
			if (type === vscode.FileType.File) {
				try {
					const fileUri = vscode.Uri.joinPath(rootPath, name);
					const content = await vscode.workspace.fs.readFile(fileUri);
					const text = Buffer.from(content).toString('utf8');
					const firstLine = text.split('\n')[0] || '';

					fileList.push({
						name,
						firstLine: firstLine.substring(0, 100) // Truncate to 100 chars
					});
				} catch (err) {
					// Skip files we can't read (binary files, permissions, etc.)
					console.log(`Could not read file ${name}:`, err);
				}
			}
		}

		return fileList;
	}
}
