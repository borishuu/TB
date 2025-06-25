export interface GenerateOptions {
    files: {
      filePath: string;
      mimeType: string;
      displayName: string;
    }[];
    title: string;
  }
  
  export interface GenerationResult {
    context: string;
    quiz: string;
    metadata?: Record<string, any>;
  }
  
  export interface LLMHandler {
    generateContext(options: GenerateOptions): Promise<string>;
    generateQuiz(context: string, options: GenerateOptions): Promise<string>;
    generateEvaluation(options: GenerateOptions): Promise<GenerationResult>;
  }
  