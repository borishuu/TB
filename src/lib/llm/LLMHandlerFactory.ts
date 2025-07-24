import { LLMGenerationHandler } from '@/types';
import { LLMRegenerationHandler } from '@/types';

type API = 'gemini' | 'mistral';
type Version = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6';

type GenerationHandlerModule = {
  getHandlerInstance(apiKey: string): LLMGenerationHandler;
};

type RegenerationHandlerModule = {
  getHandlerInstance(apiKey: string): LLMRegenerationHandler;  
};

type GenerationHandlerMap = {
  [api in API]?: {
    [version in Version]?: () => Promise<GenerationHandlerModule>;
  };
};

type RegenerationHandlerMap = {
  [api in API]?: {
    [version in Version]?: () => Promise<RegenerationHandlerModule>;
  };
};

const modelAPIMap: Record<string, API> = {
  'models/gemini-2.5-flash': 'gemini',
  'codestral-2501': 'mistral',
}

const generationHandlers: GenerationHandlerMap = {
  gemini: {
    v1: () => import('@/lib/llm/gemini/handlers/generation/v1/handler'),
    v2: () => import('@/lib/llm/gemini/handlers/generation/v2/handler'),
    v3: () => import('@/lib/llm/gemini/handlers/generation/v3/handler'),
  },
  mistral: {
    v1: () => import('@/lib/llm/mistral/handlers/generation/v1/handler'),
    v2: () => import('@/lib/llm/mistral/handlers/generation/v2/handler'),
    v3: () => import('@/lib/llm/mistral/handlers/generation/v3/handler'),
    v4: () => import('@/lib/llm/mistral/handlers/generation/v4/handler'),
    v5: () => import('@/lib/llm/mistral/handlers/generation/v5/handler'),
    v6: () => import('@/lib/llm/mistral/handlers/generation/v6/handler'),
  }
}
const regenerationHandlers: RegenerationHandlerMap = {
  gemini: {
    v1: () => import('@/lib/llm/gemini/handlers/regeneration/v1/handler'),
  },
  mistral: {
    v1: () => import('@/lib/llm/mistral/handlers/regeneration/v1/handler'),
  },
};

const apiKeyMap = {
  gemini: process.env.GEMINI_API_KEY,
  mistral: process.env.MISTRAL_API_KEY,
}

export async function getGenerationHandler(model: string, version: string): Promise<LLMGenerationHandler> {
  const api = modelAPIMap[model];
  const handlerImporter = generationHandlers[api]?.[version as Version];

  if (!handlerImporter) {
    throw new Error(`Generation handler not found for ${model}/${version}`);
  }

  const handlerModule = await handlerImporter();
  return handlerModule.getHandlerInstance(apiKeyMap[api as API] as string);
}

export async function getRegenerationHandler(model: string, version: string): Promise<LLMRegenerationHandler> {
  const api = modelAPIMap[model];
  const handlerImporter = regenerationHandlers[api]?.[version as Version];

  if (!handlerImporter) {
    throw new Error(`Regeneration handler not found for ${api}/${version}`);
  }

  const handlerModule = await handlerImporter();
  return handlerModule.getHandlerInstance(apiKeyMap[api] as string);
}
