# File Context MCP (Model Context Processor)

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

1. **FileSystemTools**
   - Handles file and directory operations
   - Provides unified interface for file content retrieval
   - Implements error handling for file operations

2. **ModelInterface**
   - Manages LLM provider interactions
   - Handles response formatting
   - Implements error handling for API calls

3. **Utility Modules**
   - `fileUtils`: File type detection and path sanitization
   - `promptUtils`: Context formatting and truncation
   - `validators`: Input validation
   - `logger`: Application logging

## API Endpoints

### 1. List Files
```
GET /api/files
Query params:
  - path: string (optional, defaults to './')
```

### 2. Query with Context
```
POST /api/query
Body:
{
  "path": string,
  "query": string,
  "model": "ollama" | "together"
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

2. **Input Validation**
   - Query content validation
   - Model type verification
   - Path structure verification

## Error Handling

The application implements comprehensive error handling:
- File system errors
- API response errors
- Invalid input errors
- Model-specific errors

## Development

### Project Structure
```
file-context-mcp/
├── src/
│   ├── core/          # Core functionality
│   ├── utils/         # Utility functions
│   └── config/        # Configuration
├── storage/           # Test files directory
└── dist/             # Compiled output
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
- Use the provided test files in `/storage`
- Test different file types and queries
- Verify model responses and error handling

## Future Considerations
1. How to handle large files efficiently
2. Expanding supported file types
3. Optimizing context processing
4. Adding streaming support for responses
5. Implementing rate limiting and caching

This project demonstrates modern TypeScript/Node.js practices with a focus on modularity, type safety, and error handling while providing a flexible interface for LLM interactions with file-based context.
