import { Mistral } from '@mistralai/mistralai';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult, FileWithContext, RegenerateOptions } from '@/types';
import * as prompts from '@/lib/llm/mistral/prompts';
import pdfParse from 'pdf-parse';

export class MistralHandler implements LLMHandler {
  genModel = 'codestral-2501';
  private static instance: MistralHandler | null = null;
  private mistral: Mistral;

  private constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey });
  }

  public static getInstance(apiKey: string): MistralHandler {
    if (!MistralHandler.instance) {
      MistralHandler.instance = new MistralHandler(apiKey);
    }
    return MistralHandler.instance;
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

  private async generateContext(combinedContent: string): Promise<{ context: string; contextPrompt: string }> {
    const contextPrompt = prompts.contextUserPromptTemplate(combinedContent);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.contextSystemPrompt
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ]
    });

    return { context: response.choices[0].message.content as string, contextPrompt: "" };
  }

  private async generateEvalPlan(context: string, options: GenerateOptions): Promise<{ plan: string; planPrompt: string }> {
    const planPrompt = prompts.evalPlanificiationUserPrompt(context);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalPlanificiationSystemPrompt(options.globalDifficulty, options.questionTypes, false)
        },
        {
          role: 'user',
          content: planPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return { plan: response.choices[0].message.content as string, planPrompt: "" };
  }

  private async generateEvalFromPlan(planJSON: string, conxtextText: string, options: GenerateOptions): Promise<{ evaluation: string; evalPrompt: string }> {
    const evalPrompt = prompts.evalUserPromptTemplate(planJSON, conxtextText, false);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPrompt(false)
        },
        {
          role: 'user',
          content: evalPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return { evaluation: response.choices[0].message.content as string, evalPrompt: "" };
  }

  private async correctEval(evaluation: string, conxtextText: string, options: GenerateOptions): Promise<{ correctedEvaluation: string; correctionPrompt: string }> {
    const evalPrompt = prompts.evalCorrectionUserPromptTemplate(evaluation, conxtextText, false);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalCorrectionSystemPrompt(options.globalDifficulty)
        },
        {
          role: 'user',
          content: evalPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return { correctedEvaluation: response.choices[0].message.content as string, correctionPrompt: "" };
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const contextStart = performance.now();

    // Étape 1 : Préparer le contexte
    const combinedContent = await this.prepareCourseContent(options.files);
    const { context, contextPrompt } = await this.generateContext(combinedContent);
    console.log("Context generated:", context);
    const contextEnd = performance.now();

    // Étape 2 : Générer le plan
    const planStart = performance.now();
    const { plan, planPrompt } = await this.generateEvalPlan(context, options);
    console.log("Plan generated:", plan);
    const planEnd = performance.now();

    // Étape 3 : Générer l'évaluation finale
    const evalStart = performance.now();
    const { evaluation, evalPrompt } = await this.generateEvalFromPlan(plan, context, options);
    const evalEnd = performance.now();
    console.log("Evaluation generated:", evaluation);

    // Étape 4 : Corriger l'évaluation finale
    const correctionStart = performance.now();
    const { correctedEvaluation, correctionPrompt } = await this.correctEval(evaluation, context, options);
    const correctionEnd = performance.now();

    return {
      context,
      evaluation: correctedEvaluation,
      metadata: {
        contextPrompt,
        planPrompt,
        evalPrompt,
        contextTimeMs: Math.round(contextEnd - contextStart),
        planTimeMs: Math.round(planEnd - planStart),
        evalTimeMs: Math.round(evalEnd - evalStart),
        model: this.genModel,
      },
    };
  }

  async regenerateQuestion(options: RegenerateOptions): Promise<string> {
    const regenPrompt = prompts.regenQuestionUserPrompt(options.question, options.prompt);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.regenQuestionSystemPrompt
        },
        {
          role: 'user',
          content: regenPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return response.choices[0].message.content as string;
  }
}
