export const validators = {
    isValidPath(path: string): boolean {
      // Basic path validation
      return typeof path === 'string' && path.length > 0 && !path.includes('..');
    },
  
    isValidQuery(query: string): boolean {
      return typeof query === 'string' && query.trim().length > 0;
    },
  
    isValidModel(model: string): boolean {
      const validModels = ['ollama', 'together'];
      return validModels.includes(model);
    }
  };