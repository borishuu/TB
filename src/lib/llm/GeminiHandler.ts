import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult } from './LLMHandler';

const quizSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    content: {
      type: SchemaType.ARRAY,
      minItems: 10,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          number: { type: SchemaType.STRING },
          questionText: { type: SchemaType.STRING },
          questionType: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['mcq', 'open', 'codeComprehension', 'codeWriting'],
          },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            minItems: 0,
          },
          correctAnswer: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
        },
        required: ['number', 'questionText', 'questionType', 'correctAnswer'],
      },
    },
  },
  required: ['content'],
};

export class GeminiHandler implements LLMHandler {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private modelName = 'models/gemini-2.5-flas'; // or 'flash'

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  async generateContext(options: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    const contextPrompt = `...`; // same context prompt as your current logic

    const uploaded = await Promise.all(
      options.files.map((file) =>
        this.fileManager.uploadFile(file.filePath, {
          mimeType: file.mimeType,
          displayName: file.displayName,
        })
      )
    );

    const contextResult = await model.generateContent([
      contextPrompt,
      ...uploaded.map((r) => ({
        fileData: { fileUri: r.file.uri, mimeType: r.file.mimeType },
      })),
    ]);

    return contextResult.response.text();
  }

  async generateQuiz(context: string, options: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: quizSchema,
      },
    });

    const quizPrompt = `...`; // same quiz prompt

    const result = await model.generateContent([quizPrompt.replace('${contextText}', context)]);
    return result.response.text();
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const contextStart = performance.now();
    const context = await this.generateContext(options);
    const contextEnd = performance.now();

    const quizStart = performance.now();
    const quiz = await this.generateQuiz(context, options);
    const quizEnd = performance.now();

    return {
      context,
      quiz,
      metadata: {
        contextTimeMs: Math.round(contextEnd - contextStart),
        quizTimeMs: Math.round(quizEnd - quizStart),
        model: this.modelName,
      },
    };
  }
}
