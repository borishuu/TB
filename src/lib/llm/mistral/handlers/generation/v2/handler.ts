import { Mistral } from '@mistralai/mistralai';
import { performance } from 'perf_hooks';
import { LLMGenerationHandler, GenerateOptions, GenerationResult, FileWithContext } from '@/types';
import { prompts } from './prompts';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

class MistralGenerationHandler implements LLMGenerationHandler {
  private static instance: MistralGenerationHandler | null = null;
  private mistral: Mistral;

  private constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey });
  }

  public static getInstance(apiKey: string): MistralGenerationHandler {
    if (!MistralGenerationHandler.instance) {
        MistralGenerationHandler.instance = new MistralGenerationHandler(apiKey);
    }
    return MistralGenerationHandler.instance;
  }

  private async parsePDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  private async combineFileContents(files: FileWithContext[]): Promise<string> {
    const contents: string[] = [];

    for (const fileObj of files) {
      try {
        if (fileObj.file instanceof File) {
          // Local file
          const text = await this.parsePDF(fileObj.file);
          contents.push(`Fichier: ${fileObj.file.name}\n\n${text}`);
        } else {
          // Pool file
          const buffer = await fs.readFile(fileObj.file.filePath);
          const parsed = await pdfParse(buffer);
          contents.push(`Fichier: ${fileObj.file.fileName}\n\n${parsed.text}`);
        }
      } catch (err) {
        const fileName = fileObj.file instanceof File ? fileObj.file.name : fileObj.file.fileName;
        console.warn(`Failed to parse PDF ${fileName}:`, err);
        throw new Error(`Failed to parse PDF file: ${fileName}`);
      }
    }

    return contents.join('\n\n---\n\n');
  }

  private async generateContext(options: GenerateOptions, combinedContent: string): Promise<string> {
    const contextPrompt = prompts.contextUserPromptTemplate(combinedContent);

    const response = await this.mistral.chat.complete({
      model: options.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.contextSystemPromptTemplate()
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    });

    return response.choices[0].message.content as string;
  }

  private async generateEval(options: GenerateOptions, context: string, combinedInspirationContent: string): Promise<string> {
    const evalPrompt = prompts.evalUserPromptTemplate(
      context,
      combinedInspirationContent
    );

    const response = await this.mistral.chat.complete({
      model: options.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPromptTemplate(combinedInspirationContent, options.globalDifficulty, options.questionTypes)
        },
        {
          role: 'user',
          content: evalPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return response.choices[0].message.content as string;
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const combinedCourseContent = await this.combineFileContents(options.files.filter(f => f.contextType === 'course'));
    const combinedInspirationContent = await this.combineFileContents(options.files.filter(f => f.contextType === 'evalInspiration'));

    const contextStart = performance.now();    
    const context = await this.generateContext(options, combinedCourseContent);
    const contextEnd = performance.now(); 

    const evalStart = performance.now();    
    const evaluation = await this.generateEval(options, context, combinedInspirationContent);
    const evalEnd = performance.now();

    return {
      context,
      evaluation,
      metadata: {
        generationPromptVersion: 'v2',
        contextTimeMs: Math.round(contextEnd - contextStart),
        evalTimeMs: Math.round(evalEnd - evalStart),
        model: options.genModel,
      },
    };
  }
}

export const getHandlerInstance = (apiKey: string): MistralGenerationHandler => {
  return MistralGenerationHandler.getInstance(apiKey);
}