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