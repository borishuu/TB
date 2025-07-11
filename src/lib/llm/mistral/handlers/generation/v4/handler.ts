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

  private async generateEval(context: string, options: GenerateOptions): Promise<string> {
    const evalPrompt = prompts.evalUserPromptTemplate(
      context,
      false
    );

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.evalSystemPromptTemplate(false, options.globalDifficulty, options.questionTypes)
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

    const combinedContent = await this.prepareCourseContent(options.files);
    const context = await this.generateContext(combinedContent);

    const contextEnd = performance.now();

    const evalStart = performance.now();
    const evaluation = await this.generateEval(context, options);
    const evalEnd = performance.now();

    console.log(options.globalDifficulty);
    console.log(options.questionTypes.join(", "));

    return {
      context,
      evaluation,
      metadata: {
        generationPromptVersion: 'v4',
        contextTimeMs: Math.round(contextEnd - contextStart),
        evalTimeMs: Math.round(evalEnd - evalStart),
        model: this.genModel,
      },
    };
  }
}

export const getHandlerInstance = (apiKey: string): MistralGenerationHandler => {
  return MistralGenerationHandler.getInstance(apiKey);
}