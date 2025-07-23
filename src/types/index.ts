
interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface EvaluationVersion {
    id: number;
    content: { content: Question[] };
    versionInfo?: { versionNumber: number; info: string };
    createdAt: string;
}

export interface Eval {
    id: number;
    title: string;
    course: object;
    versions: EvaluationVersion[]; 
    currentVersion?: EvaluationVersion;
}

export interface PoolFile {
    id: number;
    fileName: string;
    course: object;
    createdAt: string;
    filePath?: string;
    contextType?: ContextType;
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
    questionCount: string;
    generationId: string;
}

export interface GenerationResult {
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