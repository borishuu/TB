import { Mistral } from '@mistralai/mistralai';
import { performance } from 'perf_hooks';
import { LLMHandler, GenerateOptions, GenerationResult, FileWithContext, ContextType, RegenerateOptions } from '@/types';
import * as prompts from '@/lib/llm/mistral/prompts';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
//import { deepSanitize } from '@/utils/deepSanitize';

/*export class MistralHandler implements LLMHandler {
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

    return { context: response.choices[0].message.content as string, contextPrompt: prompts.contextUserPromptTemplate("") };
  }

  private async generateEval(context: string, options: GenerateOptions): Promise<{ evaluation: string; evalPrompt: string }> {
    const evalPrompt = prompts.evalUserPromptTemplate(
      context,
      false
    );

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPrompt(false, options.globalDifficulty, options.questionTypes)
        },
        {
          role: 'user',
          content: evalPrompt
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    return { evaluation: response.choices[0].message.content as string, evalPrompt: prompts.evalUserPromptTemplate(
      "",
      false
    ) };
  }

  async generateEvaluation(options: GenerateOptions): Promise<GenerationResult> {
    const contextStart = performance.now();

    const combinedContent = await this.prepareCourseContent(options.files);
    const { context, contextPrompt } = await this.generateContext(combinedContent);

    const contextEnd = performance.now();

    const evalStart = performance.now();
    const { evaluation, evalPrompt } = await this.generateEval(context, options);
    const evalEnd = performance.now();

    console.log(options.globalDifficulty);
    console.log(options.questionTypes.join(", "));

    return {
      context,
      evaluation,
      metadata: {
        contextPrompt,
        evalPrompt,
        contextTimeMs: Math.round(contextEnd - contextStart),
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
*/