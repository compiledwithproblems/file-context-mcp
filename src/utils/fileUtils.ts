import path from 'path';

export const fileUtils = {
  isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.txt', '.md', '.js', '.ts', '.json', '.yaml', '.yml', 
      '.html', '.css', '.csv', '.xml', '.log', '.env',
      '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h'
    ];
    return textExtensions.includes(path.extname(filePath).toLowerCase());
  },

  sanitizePath(inputPath: string): string {
    // Remove any parent directory traversal
    const normalizedPath = path.normalize(inputPath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.resolve(normalizedPath);
  },

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
};