import axios from 'axios';
import { config } from '../config/config';

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

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }

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