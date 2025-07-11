import { Mistral } from '@mistralai/mistralai';
import { performance } from 'perf_hooks';
import { LLMRegenerationHandler, RegenerateOptions } from '@/types';
import * as responseSchemas from '@/lib/llm/gemini/ResponseSchemas';
import { prompts } from './prompts';


class MistralRegenerateHandler implements LLMRegenerationHandler {
  genModel = 'codestral-2501';
  private static instance: MistralRegenerateHandler | null = null;
  private mistral: Mistral;

  private constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey });
  }

  public static getInstance(apiKey: string): MistralRegenerateHandler {
    if (!MistralRegenerateHandler.instance) {
        MistralRegenerateHandler.instance = new MistralRegenerateHandler(apiKey);
    }
    return MistralRegenerateHandler.instance;
  }

  async regenerateQuestion(options: RegenerateOptions): Promise<string> {
    const regenPrompt = prompts.regenQuestionUserPromptTemplate(options.question, options.prompt);

    const response = await this.mistral.chat.complete({
      model: this.genModel,
      messages: [
        {
          role: 'system',
          content: prompts.regenQuestionSystemPromptTemplate()
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

export const getHandlerInstance = (apiKey: string): MistralRegenerateHandler => {
  return MistralRegenerateHandler.getInstance(apiKey);
}