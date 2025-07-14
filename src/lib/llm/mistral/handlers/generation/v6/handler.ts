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

  private async generateEvalPlan(options: GenerateOptions, context: string, combinedInspirationContent: string): Promise<string> {
    const planPrompt = prompts.evalPlanificiationUserPromptTemplate(context, combinedInspirationContent);

    const response = await this.mistral.chat.complete({
      model: options.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalPlanificiationSystemPromptTemplate(options.globalDifficulty, options.questionTypes, combinedInspirationContent)
        },
        {
          role: 'user',
          content: planPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return response.choices[0].message.content as string;
  }

  private async generateEvalFromPlan(options: GenerateOptions, planJSON: string, conxtextText: string, combinedInspirationContent: string): Promise<string> {
    const evalPrompt = prompts.evalUserPromptTemplate(planJSON, conxtextText, combinedInspirationContent);

    const response = await this.mistral.chat.complete({
      model: options.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPromptTemplate(combinedInspirationContent)
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

  private async correctEval(evaluation: string, conxtextText: string, options: GenerateOptions): Promise<string> {
    const evalPrompt = prompts.evalCorrectionUserPromptTemplate(evaluation, conxtextText);

    const response = await this.mistral.chat.complete({
      model: options.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalCorrectionSystemPromptTemplate(options.globalDifficulty)
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

    // Prepare context
    const contextStart = performance.now();    
    const context = await this.generateContext(options, combinedCourseContent);
    const contextEnd = performance.now(); 

    // Generate plan  
    const planStart = performance.now();    
    const plan = await this.generateEvalPlan(options, context, combinedInspirationContent);    
    const planEnd = performance.now();

    // Generate evaluation
    const evalStart = performance.now();
    const evaluation = await this.generateEvalFromPlan(options, plan, context, combinedInspirationContent);
    const evalEnd = performance.now();

    // Corriger l'évaluation finale
    const correctionStart = performance.now();
    const correctedEvaluation= await this.correctEval(evaluation, context, options);
    const correctionEnd = performance.now();

    return {
      context,
      evaluation: correctedEvaluation,      
      metadata: {
        generationPromptVersion: 'v6',
        contextTimeMs: Math.round(contextEnd - contextStart),
        planTimeMs: Math.round(planEnd - planStart),
        evalTimeMs: Math.round(evalEnd - evalStart),
        correctionTimeMs: Math.round(correctionEnd - correctionStart),
        model: options.genModel,
      },
    };
  }
}

export const getHandlerInstance = (apiKey: string): MistralGenerationHandler => {
  return MistralGenerationHandler.getInstance(apiKey);
}
