import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult, FileWithContext, ContextType, RegenerateOptions } from '@/types';
import * as prompts from './prompts';
import fs from 'fs';
import path from 'path';

const questionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
      number: {
          type: SchemaType.STRING,
          description: "The question number.",
          nullable: false
      },
      questionText: {
          type: SchemaType.STRING,
          description: "The text of the question.",
          nullable: false
      },
      questionType: {
          type: SchemaType.STRING,
          format: "enum",
          description: "The type of the question.",
          enum: ["mcq", "open", "codeComprehension", "codeWriting"],
          nullable: false
      },
      options: {
          type: SchemaType.ARRAY,
          description: "Array of answer options for multiple choice questions.",
          items: {
              type: SchemaType.STRING
          },
          minItems: 0
      },
      correctAnswer: {
          type: SchemaType.STRING,
          description: "The correct answer for the question.",
          nullable: false
      },
      explanation: {
          type: SchemaType.STRING,
          description: "An explanation for the correct answer."
      }
  },
  required: ["number", "questionText", "questionType", "correctAnswer"]
};

const evalSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    content: {
      type: SchemaType.ARRAY,
      minItems: 10,
      items: questionSchema,
    },
  },
  required: ['content'],
};

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
        responseSchema: evalSchema,
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
            responseSchema: questionSchema
        }
    });

    const result = await regenModel.generateContent([
        questionRegenPrompt
    ]);

    return result.response.text();
  }
}

