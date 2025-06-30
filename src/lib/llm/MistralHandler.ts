import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult } from '@/types';
import * as prompts from './prompts';
import fs from 'fs';
import path from 'path';

// TODO: dynamically adapt schema based on user input, ajouter descriptions sur fichiers, edit question, stocker prompt avec quiz pour avoir un suivi, creation date, gemni model, etc... penser cdc
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
  genModel = 'models/gemini-2.0-flash';
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;   

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  private async uploadFiles(
    files: (File | { fileName: string, filePath: string, mimeType: string })[]
  ): Promise<{ uri: string; mimeType: string }[]> {
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const results = await Promise.all(
      files.map(async (file) => {
        if (file instanceof File) {
          // From user upload
          const fileBuffer = await file.arrayBuffer();
          const tmpFilePath = path.join(tmpDir, file.name);
          await fs.promises.writeFile(tmpFilePath, Buffer.from(fileBuffer));

          const upload = await this.fileManager.uploadFile(tmpFilePath, {
            mimeType: file.type,
            displayName: file.name,
          });

          await fs.promises.unlink(tmpFilePath);
          return { uri: upload.file.uri, mimeType: upload.file.mimeType };
        } else {
          // From database
          const upload = await this.fileManager.uploadFile(file.filePath, {
            mimeType: file.mimeType,
            displayName: file.fileName,
          });
          return { uri: upload.file.uri, mimeType: upload.file.mimeType };
        }
      })
    );

    return results;
  } 


  private async generateContext(options: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.genModel });

    const contextPrompt = `${prompts.contextSystemPrompt} \n\n ${prompts.contextUserPromptTemplate("")}`;

    console.log("Generating context with prompt:", contextPrompt);
    console.log("Files to upload:", options.files.map(f => f instanceof File ? f.name : f.fileName));
    const uploadedFiles = await this.uploadFiles(options.files);

    const fileData = uploadedFiles.map((r) => ({ fileData: { 
      fileUri: r.uri, 
      mimeType: r.mimeType },
    }))

    console.log("Uploaded files:", fileData);

    const contextResult = await model.generateContent([
      contextPrompt,
      ...fileData,
    ]);

    return contextResult.response.text();
  }

  private async generateEval(context: string, options: GenerateOptions): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.genModel,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: quizSchema,
      },
    });

    const evalPrompt = `${prompts.quizSystemPrompt} \n\n ${prompts.quizUserPromptTemplate(context)}`;

    const result = await model.generateContent([ evalPrompt ]);
    return result.response.text();
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const contextStart = performance.now();
    const context = await this.generateContext(options);
    const contextEnd = performance.now();

    const evalStart = performance.now();
    const evaluation = await this.generateEval(context, options);
    const evalEnd = performance.now();

    return {
      context,
      evaluation,
      metadata: {
        contextTimeMs: Math.round(contextEnd - contextStart),
        quizTimeMs: Math.round(evalEnd - evalStart),
        model: this.genModel,
      },
    };
  }
}
