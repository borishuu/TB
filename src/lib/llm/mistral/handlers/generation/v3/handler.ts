import { Mistral } from '@mistralai/mistralai';
import { performance } from 'perf_hooks';
import { LLMGenerationHandler, GenerateOptions, GenerationResult, FileWithContext } from '@/types';
import { prompts } from './prompts';
import pdfParse from 'pdf-parse';

class MistralGenerationHandler implements LLMGenerationHandler {
  genModel = 'codestral-2501';
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

  private async prepareCourseContent(files: FileWithContext[]): Promise<string> {
    const courseFiles = files.filter(f => f.contextType === 'course');
    const contents: string[] = [];

    for (const fileObj of courseFiles) {
      if (fileObj.file instanceof File) {
        try {
          const text = await this.parsePDF(fileObj.file);
          contents.push(`Fichier: ${fileObj.file.name}\n\n${text}`);
        } catch (err) {
          console.warn(`Failed to parse PDF ${fileObj.file.name}:`, err);
          throw new Error(`Failed to parse PDF file: ${fileObj.file.name}`);
        }
      }
    }

    return contents.join('\n\n---\n\n');
  }

  private async generateContext(combinedContent: string): Promise<string> {
    const contextPrompt = prompts.contextUserPromptTemplate(combinedContent);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
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

  private async generateEvalPlan(context: string, options: GenerateOptions): Promise<string> {
    const planPrompt = prompts.evalPlanificiationUserPrompt(context);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalPlanificiationSystemPromptTemplate(options.globalDifficulty, options.questionTypes, false)
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

  private async generateEvalFromPlan(planJSON: string, conxtextText: string, options: GenerateOptions): Promise<string> {
    const evalPrompt = prompts.evalUserPromptTemplate(planJSON, conxtextText, false);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPromptTemplate(false)
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
    const contextStart = performance.now();

    // Préparer le contexte
    const combinedContent = await this.prepareCourseContent(options.files);
    const context = await this.generateContext(combinedContent);
    console.log("Context generated:", context);
    const contextEnd = performance.now();

    // Générer le plan
    const planStart = performance.now();
    const plan = await this.generateEvalPlan(context, options);
    console.log("Plan generated:", plan);
    const planEnd = performance.now();

    // Générer l'évaluation finale
    const evalStart = performance.now();
    const evaluation = await this.generateEvalFromPlan(plan, context, options);
    const evalEnd = performance.now();
    console.log("Evaluation generated:", evaluation);

    return {
      context,
      evaluation: evaluation,
      metadata: {
        generationPromptVersion: 'v3',
        contextTimeMs: Math.round(contextEnd - contextStart),
        planTimeMs: Math.round(planEnd - planStart),
        evalTimeMs: Math.round(evalEnd - evalStart),
        model: this.genModel,
      },
    };
  }
}

export const getHandlerInstance = (apiKey: string): MistralGenerationHandler => {
  return MistralGenerationHandler.getInstance(apiKey);
}