import express from 'express';
import { Request } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIV3 } from 'openapi-types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { FileSystemTools } from './core/fileSystem';
import { ModelInterface } from './core/modelInterface';
import { Logger } from './utils/logger';
import { fileUtils } from './utils/fileUtils';
import { promptUtils } from './utils/promptUtils';
import { validators } from './utils/validators';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.join(__dirname, '../storage'));
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (fileUtils.isTextFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only text files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Load OpenAPI specification from YAML file
const openApiPath = path.join(__dirname, 'resources', 'file-context-api.yml');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as OpenAPIV3.Document;

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

const fileTools = new FileSystemTools();
const modelInterface = new ModelInterface();

// Get files/directories at path
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path as string || './';
    const files = await fileTools.readDirectory(dirPath);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Query LLM with file context
app.post('/api/query', async (req, res) => {
    try {
      const { path, query, model = 'ollama' } = req.body;
      
      // Validate inputs
      if (!validators.isValidPath(path) || !validators.isValidQuery(query)) {
        throw new Error('Invalid input parameters');
      }
  
      const sanitizedPath = fileUtils.sanitizePath(path);
      const contextFiles = await fileTools.getContextFromPath(sanitizedPath);
      
      // Filter for text files and format context
      const context = contextFiles
        .filter(file => file.content && fileUtils.isTextFile(file.path))
        .map(file => `File: ${file.name}\n${file.content}`)
        .join('\n\n');
  
      const formattedPrompt = promptUtils.formatContextPrompt(
        promptUtils.truncateContext(context),
        query
      );
  
      Logger.debug('Processing query', { path: sanitizedPath, model });
      
      const response = model === 'ollama' 
        ? await modelInterface.queryOllama(formattedPrompt, context)
        : await modelInterface.queryTogether(formattedPrompt, context);
  
      Logger.info('Query processed successfully');
      res.json(response);
    } catch (error) {
      Logger.error('Error processing query', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

// Upload file to storage
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    Logger.info('File uploaded successfully', { 
      filename: req.file.originalname,
      size: req.file.size
    });

    res.json({ 
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        size: fileUtils.formatFileSize(req.file.size),
        path: req.file.path
      }
    });
  } catch (error) {
    Logger.error('Error uploading file', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete file from storage
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../storage', filename);

    if (!validators.isValidPath(filePath)) {
      throw new Error('Invalid file path');
    }

    await fileTools.deleteFile(filePath);
    Logger.info('File deleted successfully', { filename });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    Logger.error('Error deleting file', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});