interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface Eval {
    id: number;
    title: string;
    content: { content: Question[] };
}

export interface PoolFile {
    id: number;
    fileName: string;
    course: object;
    createdAt: string;
    filePath?: string;
}

export interface Course {
    id: number;
    courseName: string;
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
    genModel: string;
    files: FileWithContext[];
    questionTypes: string[];
    globalDifficulty: string;
}

export interface GenerationResult {
    context: string;
    evaluation: string;
    metadata: object;
}

export interface RegenerateOptions {
    genModel: string;
    prompt: string;
    question: any;
}

export interface LLMGenerationHandler {
    generateEvaluation(options: GenerateOptions): Promise<GenerationResult>;
}

export interface LLMRegenerationHandler {
    regenerateQuestion(options: RegenerateOptions): Promise<string>;
}