import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { performance } from 'perf_hooks';
import { LLMRegenerationHandler, RegenerateOptions } from '@/types';
import * as responseSchemas from '@/lib/llm/gemini/ResponseSchemas';
import { prompts } from './prompts';


class GeminiRegenerateHandler implements LLMRegenerationHandler {
  private static instance: GeminiRegenerateHandler | null = null;
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;

  private constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey); 
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  public static getInstance(apiKey: string): GeminiRegenerateHandler {
    if (!GeminiRegenerateHandler.instance) {
      GeminiRegenerateHandler.instance = new GeminiRegenerateHandler(apiKey);
    }
    return GeminiRegenerateHandler.instance;
  }

  async regenerateQuestion(options: RegenerateOptions) {
    const regenModel = this.genAI.getGenerativeModel({
        model: options.genModel,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchemas.questionSchema
        }
    });

    const result = await regenModel.generateContent([
      prompts.regenQuestionPromptTemplate(options.question, options.prompt)
    ]);

    return result.response.text();
  }
}

export const getHandlerInstance = (apiKey: string): GeminiRegenerateHandler => {
  return GeminiRegenerateHandler.getInstance(apiKey);
}