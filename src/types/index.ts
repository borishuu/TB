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

export interface GenerateOptions {
    files: (File |{
        fileName: string;
        filePath: string;
        mimeType: string;
    })[];
    questionTypes: string[];
    globalDifficulty: string;
}

export interface GenerationResult {
    context: string;
    evaluation: string;
    metadata?: Record<string, any>;
}

export interface LLMHandler {
    genModel: string;
    generateEvaluation(options: GenerateOptions): Promise<GenerationResult>;
}