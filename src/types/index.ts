export interface Eval {
    id: number;
    title: string;
    content: any;
}

export interface PoolFile {
    id: number;
    fileName: string;
    course: object;
    createdAt: string;
}

export type ContextType = 'evalInspiration' | 'course';

export type LocalFile = {
    file: File;
    contextType: ContextType;
 };

 export type FileWithContext = {
    file: File | { fileName: string; filePath: string; mimeType: string };
    contextType: ContextType;
  };

export interface GenerateOptions {
    files: FileWithContext[];
    questionTypes: string[];
    globalDifficulty: string;
}

export interface GenerationResult {
    context: string;
    evaluation: string;
    metadata?: Record<string, any>;
}

export interface RegenerateOptions {
    prompt: string;
    question: any;
}


export interface LLMHandler {
    genModel: string;
    generateEvaluation(options: GenerateOptions): Promise<GenerationResult>;
    regenerateQuestion(options: RegenerateOptions): Promise<string>;
}