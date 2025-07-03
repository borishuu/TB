import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult, FileWithContext, ContextType, RegenerateOptions } from '@/types';
import * as responseSchemas from './ResponseSchemas';
import * as prompts from '../prompts';
import fs from 'fs';
import path from 'path';

export class GeminiHandler implements LLMHandler {
  genModel = 'models/gemini-2.5-flash';
  private static instance: GeminiHandler | null = null;
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;   

  private constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  public static getInstance(apiKey: string): GeminiHandler {
    if (!GeminiHandler.instance) {
      GeminiHandler.instance = new GeminiHandler(apiKey);
    }
    return GeminiHandler.instance;
  }

  private combinePropts(systemPrompt: string, userPrompt: string): string {
    return `${systemPrompt} \n\n ${userPrompt}`;
  }

  private async uploadFiles(
    files: FileWithContext[]
  ): Promise<{ uri: string; mimeType: string, contextType: ContextType }[]> {
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const results = await Promise.all(
      files.map(async (file) => {
        if (file.file instanceof File) {
          // From user upload
          const fileBuffer = await file.file.arrayBuffer();
          const tmpFilePath = path.join(tmpDir, file.file.name);
          await fs.promises.writeFile(tmpFilePath, Buffer.from(fileBuffer));

          const upload = await this.fileManager.uploadFile(tmpFilePath, {
            mimeType: file.file.type,
            displayName: file.file.name,
          });

          await fs.promises.unlink(tmpFilePath);
          return { uri: upload.file.uri, mimeType: upload.file.mimeType, contextType: file.contextType };
        } else {
          // From pool
          const upload = await this.fileManager.uploadFile(file.file.filePath, {
            mimeType: file.file.mimeType,
            displayName: file.file.fileName,
          });
          return { uri: upload.file.uri, mimeType: upload.file.mimeType, contextType: file.contextType };
        }
      })
    );

    return results;
  } 


  private async generateContext(uploadedCourseFiles: { uri: string; mimeType: string, contextType: ContextType }[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.genModel });
    
    const contextPrompt = this.combinePropts(prompts.contextSystemPrompt, prompts.contextUserPromptTemplate(""));

    //console.log("Generating context with prompt:", contextPrompt);
    //console.log("Files to upload:", courseFiles.map(f => f.file instanceof File ? f.file.name : f.file.fileName));

    const fileData = uploadedCourseFiles.map((r) => ({ fileData: { 
      fileUri: r.uri, 
      mimeType: r.mimeType },
    }))

    //console.log("Uploaded files:", fileData);

    const contextResult = await model.generateContent([
      contextPrompt,
      ...fileData,
    ]);

    return contextResult.response.text();
  }

  private async generateEval(context: string, options: GenerateOptions, uploadedInspirationFiles: { uri: string; mimeType: string, contextType: ContextType }[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.genModel,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchemas.evalSchema,
      },
    });

    if (uploadedInspirationFiles.length > 0) {
      console.log("Inspiration files detected, using with context prompt.");
      const fileData = uploadedInspirationFiles.map((r) => ({ fileData: { 
        fileUri: r.uri, 
        mimeType: r.mimeType },
      }))
      
      const evalPrompt = this.combinePropts(prompts.evalSystemPrompt(true), prompts.evalUserPromptTemplate(context, options.globalDifficulty, options.questionTypes, true));
      const result = await model.generateContent([ 
        evalPrompt,
        ...fileData 
      ]);
      return result.response.text();

    } else {
      console.log("No inspiration files dtected.");
      const evalPrompt = this.combinePropts(prompts.evalSystemPrompt(false), prompts.evalUserPromptTemplate(context, options.globalDifficulty, options.questionTypes, false));

      const result = await model.generateContent([ evalPrompt ]);
      return result.response.text();
    }
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const uploadedFiles = await this.uploadFiles(options.files);

    if (uploadedFiles.some(f => f.contextType === 'evalInspiration')) {
      console.log("Inspiration files detected, using with context prompt.");
    }

    const contextStart = performance.now();
    const context = await this.generateContext(uploadedFiles.filter(f => f.contextType === 'course'));
    const contextEnd = performance.now();

    const evalStart = performance.now();
    const evaluation = await this.generateEval(context, options, uploadedFiles.filter(f => f.contextType === 'evalInspiration'));
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

  async regenerateQuestion(options: RegenerateOptions) {
    const questionRegenPrompt = this.combinePropts(prompts.regenQuestionSystemPrompt, prompts.regenQuestionUserPrompt(options.question, options.prompt));

    const regenModel = this.genAI.getGenerativeModel({
        model: this.genModel,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchemas.questionSchema
        }
    });

    const result = await regenModel.generateContent([
        questionRegenPrompt
    ]);

    return result.response.text();
  }
}

