# File Context MCP (Model Context Processor)

[![smithery badge](https://smithery.ai/badge/@compiledwithproblems/file-context-mcp)](https://smithery.ai/server/@compiledwithproblems/file-context-mcp)

## Overview
File Context MCP is a TypeScript-based application that provides an API for querying Large Language Models (LLMs) with context from local files. It supports multiple LLM providers (Ollama and Together.ai) and can process various file types to generate context-aware responses.

## Core Features

### 1. File System Navigation
- Dynamic file and directory traversal
- Support for multiple file types (`.txt`, `.md`, `.ts`, `.json`, etc.)
- Safe path handling with sanitization

```1:12:src/utils/fileUtils.ts
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

```


### 2. Context Processing
- Intelligent context formatting for LLM queries
- Context truncation to handle large files
- File content aggregation for directory queries

```1:30:src/utils/promptUtils.ts
export const promptUtils = {
    formatContextPrompt(context: string, query: string): string {
      return `
  You are an AI assistant analyzing the following content:
  
  ---BEGIN CONTEXT---
  ${context}
  ---END CONTEXT---
  
  Please respond to the following query:
  ${query}
  
  Base your response only on the information provided in the context above.
  `;
    },
  
    truncateContext(context: string, maxLength: number = 4000): string {
      if (context.length <= maxLength) return context;
      
      // Try to truncate at a natural break point
      const truncated = context.slice(0, maxLength);
      const lastNewline = truncated.lastIndexOf('\n');
      
      if (lastNewline > maxLength * 0.8) {
        return truncated.slice(0, lastNewline) + '\n... (truncated)';
      }
      
      return truncated + '... (truncated)';
    }
  };
```


### 3. Multi-Model Support
- Ollama (local) integration
- Together.ai (cloud) integration
- Extensible model interface design

```4:69:src/core/modelInterface.ts
export interface LLMResponse {
  text: string;
  model: string;
  error?: string;
}

export class ModelInterface {
  async queryOllama(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(`${config.ollamaBaseUrl}/api/generate`, {
        model: config.modelName,
        prompt: this.formatPrompt(prompt, context),
        stream: false
      });
      return {
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }
    } catch (error) {
      return {
        text: response.data.response,
        model: 'ollama'
      };
    } catch (error) {
      console.error('Ollama error:', error);
      return {
        text: '',
        model: 'ollama',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
          model: config.modelName,
  async queryTogether(prompt: string, context: string): Promise<LLMResponse> {
    try {
      const response = await axios.post(
        'https://api.together.xyz/inference',
        {
          model: config.modelName,
          prompt: this.formatPrompt(prompt, context),
          max_tokens: 512,
        },
        {
          headers: {
            Authorization: `Bearer ${config.togetherApiKey}`
          }
        }
      );
      return {
      return {
        text: response.data.output.text,
        model: 'together'
      };
    } catch (error) {
      return {
        text: '',
        model: 'together',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  private formatPrompt(prompt: string, context: string): string {
    return `Context: ${context}\n\nQuestion: ${prompt}`;
  }
}
```


## Architecture

### Core Components

1. **Server (server.ts)**
   - Express.js REST API implementation
   - File upload/delete handling with multer
   - Request validation and routing
   - OpenAPI/Swagger integration

2. **FileSystemTools (core/fileSystem.ts)**
   - File and directory operations
   - Content reading and parsing
   - Directory traversal
   - Secure file deletion
   - Error handling for file operations

3. **ModelInterface (core/modelInterface.ts)**
   - Multiple LLM provider support (Ollama, Together.ai)
   - Response formatting and error handling
   - Configurable model parameters
   - Unified query interface

4. **Utility Modules**
   - `fileUtils`: File type detection, path sanitization, size formatting
   - `promptUtils`: Context formatting, intelligent truncation
   - `validators`: Path, query, and model validation
   - `logger`: Structured logging with levels

5. **Configuration (config/config.ts)**
   - Environment variable management
   - API keys and endpoints
   - Model configuration
   - Server settings

6. **API Specification (resources/file-context-api.yml)**
   - OpenAPI 3.0 documentation
   - Request/response schemas
   - Endpoint documentation
   - Error response definitions

## API Endpoints

### 1. List Files
```
GET /api/files
Query params:
  - path: string (optional, defaults to './')
Response:
  - Array of FileInfo objects with file/directory details
```

### 2. Upload File
```
POST /api/files/upload
Content-Type: multipart/form-data
Body:
  - file: File (must be a text file, max 5MB)
Response:
{
  "message": "File uploaded successfully",
  "file": {
    "name": string,
    "size": string,
    "path": string
  }
}
```

### 3. Delete File
```
DELETE /api/files/{filename}
Params:
  - filename: string (name of file to delete)
Response:
{
  "message": "File deleted successfully"
}
```

### 4. Query with Context
```
POST /api/query
Body:
{
  "path": string,
  "query": string,
  "model": "ollama" | "together"
}
Response:
{
  "text": string,
  "model": string,
  "error?: string
}
```

## Setup and Configuration

1. **Environment Variables**
```env
TOGETHER_API_KEY=your_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=llama2
PORT=3001
```

2. **Installation**
```bash
npm install
```

### Installing via Smithery

To install File Context MCP for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@compiledwithproblems/file-context-mcp):

```bash
npx @smithery/cli@latest install @compiledwithproblems/file-context-mcp --client claude
```

3. **Running the Application**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## How It Works

1. **File Processing Flow**
   - Request received → Path validation → File reading → Content extraction
   - Directory handling includes recursive file reading
   - Content filtering based on file type
   - File uploads are validated for type and size
   - Secure file deletion with path validation

2. **Context Processing**
   - File contents are aggregated
   - Context is formatted with clear boundaries
   - Large contexts are intelligently truncated
   - Prompt formatting adds structure for LLM understanding

3. **Model Integration**
   - Unified interface for different LLM providers
   - Error handling and response normalization
   - Configurable model parameters

## Security Features

1. **Path Sanitization**
   - Prevention of directory traversal attacks
   - Path validation and normalization
   - Safe file type checking

2. **File Upload Security**
   - File type validation
   - File size limits (5MB max)
   - Secure file storage
   - Safe file deletion

3. **Input Validation**
   - Query content validation
   - Model type verification
   - Path structure verification
   - File content validation

## Supported File Types

The application supports the following text-based file types:
- Documentation: `.txt`, `.md`
- Code files: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.cpp`, `.c`, `.h`
- Configuration: `.json`, `.yaml`, `.yml`, `.env`
- Web files: `.html`, `.css`
- Data files: `.csv`, `.xml`, `.log`

File type validation is enforced during:
- File uploads
- Context processing
- File reading operations

Maximum file size: 5MB per file

## Error Handling

The application implements comprehensive error handling:
- File system errors
- API response errors
- Invalid input errors
- Model-specific errors
- File upload/deletion errors

## Development

### Project Structure
```
file-context-mcp/
├── src/
│   ├── server.ts              # Main application server
│   ├── core/                  # Core functionality
│   │   ├── fileSystem.ts      # File operations handling
│   │   └── modelInterface.ts  # LLM provider integrations
│   ├── utils/                 # Utility functions
│   │   ├── fileUtils.ts       # File type & path utilities
│   │   ├── promptUtils.ts     # Prompt formatting
│   │   ├── validators.ts      # Input validation
│   │   └── logger.ts         # Application logging
│   ├── config/               # Configuration
│   │   └── config.ts        # Environment & app config
│   └── resources/           # API specifications
│       └── file-context-api.yml  # OpenAPI spec
├── storage/                 # File storage directory
│   ├── code-samples/       # Example code files
│   └── notes/             # Documentation & notes
├── postman/               # API testing
│   └── File-Context-MCP.postman_collection.json  # Postman collection
├── dist/                  # Compiled output
└── node_modules/         # Dependencies
```

### Adding New Features
1. **New File Types**
   - Add extensions to `fileUtils.isTextFile()`
   - Implement specific handlers if needed

2. **New Model Providers**
   - Extend `ModelInterface` class
   - Add provider to `validators.isValidModel()`
   - Implement provider-specific error handling

## Testing

### Postman Collection
The project includes a Postman collection (`postman/File-Context-MCP.postman_collection.json`) for testing all API endpoints. To use it:

1. **Import the Collection**
   - Open Postman
   - Click "Import" button
   - Select or drag the `File-Context-MCP.postman_collection.json` file

2. **Available Requests**
   ```
   File-Context-MCP
   ├── List files
   │   └── GET http://localhost:3001/api/files?path=./storage
   ├── Query
   │   └── POST http://localhost:3001/api/query (single file analysis)
   ├── Analyze multiple files
   │   └── POST http://localhost:3001/api/query (directory analysis)
   └── File Upload
       └── POST http://localhost:3001/api/files/upload
   ```

3. **Testing File Operations**
   - **List Files**: View contents of the storage directory
   - **Upload File**: Use form-data with key "file" and select a text file
   - **Query File**: Analyze single file contents with LLM
   - **Analyze Directory**: Process multiple files with LLM

4. **Example Queries**
   ```json
   // Single file analysis
   {
       "path": "./storage/code-samples/example.ts",
       "query": "Explain what this TypeScript code does",
       "model": "ollama"
   }

   // Directory analysis
   {
       "path": "./storage",
       "query": "What types of files are in this directory and summarize their contents?",
       "model": "ollama"
   }
   ```

5. **File Upload Guide**
   - Use the "File Upload" request
   - Select "form-data" in the Body tab
   - Add key "file" with type "File"
   - Choose a supported text file (see Supported File Types)
   - Maximum file size: 5MB

### Manual Testing
- Use the provided test files in `/storage`
- Test different file types and queries
- Verify model responses and error handling
- Test file size limits and type restrictions

### Environment Setup
Make sure to:
- Have the server running (`npm run dev`)
- Configure environment variables
- Have Ollama running locally (for Ollama model)
- Set Together.ai API key (for Together model)

## Future Considerations
1. How to handle large files efficiently
2. Expanding supported file types
3. Optimizing context processing
4. Adding streaming support for responses
5. Implementing rate limiting and caching

This project demonstrates modern TypeScript/Node.js practices with a focus on modularity, type safety, and error handling while providing a flexible interface for LLM interactions with file-based context.
