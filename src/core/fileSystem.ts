import fs from 'fs/promises';
import path from 'path';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
}

export class FileSystemTools {
  async readDirectory(dirPath: string): Promise<FileInfo[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        files.push({
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file'
        });
      }

      return files;
    } catch (error) {
      throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readFile(filePath: string): Promise<FileInfo> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        name: path.basename(filePath),
        path: filePath,
        type: 'file',
        content
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContextFromPath(targetPath: string): Promise<FileInfo[]> {
    const stat = await fs.stat(targetPath);
    
    if (stat.isDirectory()) {
      return this.readDirectory(targetPath);
    } else {
      return [await this.readFile(targetPath)];
    }
  }
}