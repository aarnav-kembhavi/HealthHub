import { customProvider } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY?.trim() ?? '',
});

// OpenRouter: OpenAI-compatible API at https://openrouter.ai/api/v1
const openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
// Only create OpenRouter client when API key is present (prevents fallback to OpenRouter with dummy key)
const openrouter = openrouterApiKey ? createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: openrouterApiKey,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Health Monitor',
  },
}) : null;

// BioMistral: local model (Ollama or LM Studio). No API key required.
const biomistralBaseUrl = process.env.BIOMISTRAL_BASE_URL?.trim() || 'http://localhost:11434/v1';
const biomistralModelName = process.env.BIOMISTRAL_MODEL?.trim() || 'biomistral';
const biomistral = createOpenAI({
  baseURL: biomistralBaseUrl,
  apiKey: process.env.BIOMISTRAL_API_KEY?.trim() || 'ollama', // Ollama ignores this; LM Studio may use it
});

// BioMistral via Hugging Face Inference Providers (OpenAI-compatible). Set HF_TOKEN in .env.local.
const hfToken = process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_TOKEN?.trim();
const biomistralHfModel = process.env.BIOMISTRAL_HF_MODEL?.trim() || 'BioMistral/BioMistral-7B';
const biomistralHf = createOpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: hfToken || 'dummy',
});
const biomistralHfModelInstance = hfToken ? biomistralHf(biomistralHfModel) : null;

// OpenRouter models - always show in dropdown (API key checked server-side in route)
const openrouterDefaultModel = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o';
const OPENROUTER_MODELS_LIST = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (OpenRouter)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OpenRouter)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
  { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5 (OpenRouter)' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (OpenRouter)' },
  // OpenRouter free-tier models
  { value: 'openai/gpt-oss-120b:free', label: 'GPT OSS 120B (OpenRouter, free)' },
  { value: 'qwen/qwen3-next-80b-a3b-instruct:free', label: 'Qwen3 Next 80B (OpenRouter, free)' },
  { value: 'openai/gpt-oss-20b:free', label: 'GPT OSS 20B (OpenRouter, free)' },
];

// Default first = OpenRouter, then Groq, then BioMistral options
export const models = [
  ...OPENROUTER_MODELS_LIST,
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Groq)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Groq)' },
  { value: 'biomistral', label: 'BioMistral (local)' },
  ...(hfToken ? [{ value: 'biomistral-hf', label: 'BioMistral (Hugging Face)' }] : []),
  { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B (Groq)' },
  { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B (Groq)' },
];

// Build language models object
const languageModels: Record<string, any> = {
  biomistral: biomistral(biomistralModelName),
  ...(biomistralHfModelInstance ? { 'biomistral-hf': biomistralHfModelInstance } : {}),
  'llama-3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
  'llama-3.1-8b-instant': groq('llama-3.1-8b-instant'),
  'openai/gpt-oss-120b': groq('openai/gpt-oss-120b'),
  'openai/gpt-oss-20b': groq('openai/gpt-oss-20b'),
};

// Add all OpenRouter models only when OpenRouter client is available
if (openrouter) {
  OPENROUTER_MODELS_LIST.forEach((m) => {
    languageModels[m.value] = openrouter(m.value);
  });
  // Log OpenRouter models added (server-side only)
  if (typeof window === 'undefined') {
    console.log('[providers] Added OpenRouter models:', OPENROUTER_MODELS_LIST.map(m => m.value));
  }
} else {
  // Log if OpenRouter models were NOT added (server-side only)
  if (typeof window === 'undefined') {
    console.warn('[providers] OpenRouter client not available - models not added to languageModels');
  }
}

// Always use Groq as fallback (more reliable, always configured)
// This prevents accidentally falling back to OpenRouter when a Groq model is selected
export const myProvider = customProvider({
  languageModels,
  fallbackProvider: groq,
});
