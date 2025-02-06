import express from 'express';
import cors from 'cors';
import { FileSystemTools } from './core/fileSystem';
import { ModelInterface } from './core/modelInterface';
import { Logger } from './utils/logger';
import { fileUtils } from './utils/fileUtils';
import { promptUtils } from './utils/promptUtils';
import { validators } from './utils/validators';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});