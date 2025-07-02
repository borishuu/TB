import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult, FileWithContext, ContextType } from '@/types';
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
  genModel = 'models/gemini-2.5-flash';
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;   

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
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
          // From database
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

    const contextPrompt = `${prompts.contextSystemPrompt} \n\n ${prompts.contextUserPromptTemplate("")}`;

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
        responseSchema: quizSchema,
      },
    });

    if (uploadedInspirationFiles.length > 0) {
      console.log("Inspiration files detected, using with context prompt.");
      const fileData = uploadedInspirationFiles.map((r) => ({ fileData: { 
        fileUri: r.uri, 
        mimeType: r.mimeType },
      }))
      const evalPrompt = `${prompts.quizSystemPrompt(true)} \n\n ${prompts.quizUserPromptTemplate(context, options.globalDifficulty, options.questionTypes, true)}`;
      const result = await model.generateContent([ 
        evalPrompt,
        ...fileData 
      ]);
      return result.response.text();

    } else {
      console.log("No inspiration files dtected.");
      const evalPrompt = `${prompts.quizSystemPrompt(false)} \n\n ${prompts.quizUserPromptTemplate(context, options.globalDifficulty, options.questionTypes, false)}`;

      const result = await model.generateContent([ evalPrompt ]);
      return result.response.text();
    }
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    options.files.forEach(file => {
      if (file.contextType === 'course') {
        console.log(`File ${file.file instanceof File ? file.file.name : file.file.fileName} is a course context file.`);
      } else if (file.contextType === 'evalInspiration') {
        console.log(`File ${file.file instanceof File ? file.file.name : file.file.fileName} is an eval inspiration context file.`);
      }
    });

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
}
