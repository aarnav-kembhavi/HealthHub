import { streamText, CoreMessage , smoothStream} from 'ai';
import { getSystemPrompt } from '@/lib/prompts/system-prompt';
import { querySupabaseTool } from '@/lib/tools/query-supabase';
import { generateChart } from '@/lib/tools/generate-chart';
import { tavilySearchTool } from '@/lib/tools/tavily-search';
import { ragRetrievalTool } from '@/lib/tools/rag-retrieval';
import { generateImage } from '@/lib/tools/generate-image';
import { sendHealthReport } from '@/lib/tools/send-health-report';
import { myProvider, models } from '@/lib/ai/providers';
import { getUser } from '@/hooks/get-user';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
export const maxDuration = 30;

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const OPENROUTER_MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-70b-instruct',
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-20b:free',
];
const VALID_MODEL_IDS = new Set(models.map((m) => m.value));

// Get default model (OpenRouter if available, otherwise Groq)
const getDefaultModel = () => {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey && !openrouterKey.startsWith('your_')) {
    return process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o';
  }
  return 'llama-3.3-70b-versatile';
};

function jsonResponse(obj: { error: string }, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

export async function POST(req: Request) {
  try {
    let messages: CoreMessage[];
    let data: any;
    let selectedModel: string;
    try {
      const body = await req.json();
      messages = body.messages ?? [];
      data = body.data;
      selectedModel = body.selectedModel ?? getDefaultModel();
    } catch {
      return jsonResponse({ error: 'Invalid request body' }, 400);
    }

    if (!VALID_MODEL_IDS.has(selectedModel)) {
      return jsonResponse({
        error: `Unknown model "${selectedModel}". Choose one from the dropdown (e.g. Llama 3.3 70B or BioMistral).`,
      }, 400);
    }

    // Require Groq API key only when a Groq model is selected
    if (GROQ_MODELS.includes(selectedModel)) {
      const groqKey = process.env.GROQ_API_KEY?.trim();
      if (!groqKey || groqKey.startsWith('your_')) {
        return jsonResponse({
          error: 'GROQ_API_KEY is missing. In .env.local set GROQ_API_KEY=your_key from https://console.groq.com, then restart: npm run dev',
        }, 500);
      }
    }

    // When using BioMistral (Hugging Face), HF token is required
    if (selectedModel === 'biomistral-hf') {
      const hfToken = process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_TOKEN?.trim();
      if (!hfToken || hfToken.startsWith('your_')) {
        return jsonResponse({
          error: 'HF_TOKEN is missing. Set HF_TOKEN in .env.local (from https://huggingface.co/settings/tokens), then restart.',
        }, 500);
      }
    }

    // When using an OpenRouter model, API key is required
    // Check exact match first, then check prefixes (but exclude Groq models)
    const isGroqModel = GROQ_MODELS.includes(selectedModel);
    const isOpenRouterModel = !isGroqModel && (
      OPENROUTER_MODELS.includes(selectedModel) ||
      (selectedModel.startsWith('openai/gpt-4') && !selectedModel.includes('gpt-oss')) ||
      selectedModel.startsWith('anthropic/') ||
      selectedModel.startsWith('google/') ||
      selectedModel.startsWith('meta-llama/') ||
      selectedModel.includes(':free') // OpenRouter free-tier models have :free suffix
    );
    if (isOpenRouterModel) {
      const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
      if (!openrouterKey || openrouterKey.startsWith('your_')) {
        return jsonResponse({
          error: 'OPENROUTER_API_KEY is missing. Set OPENROUTER_API_KEY in .env.local (get a key from https://openrouter.ai/keys), then restart the dev server.',
        }, 500);
      }
    }

    let user;
    try {
      user = await getUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[API] Chat-v3 getUser error:', err);
      return jsonResponse({
        error: `Sign-in problem: ${msg}. Make sure you're logged in and Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are set in .env.local.`,
      }, 500);
    }

    if (!user) {
      return jsonResponse({ error: 'You must be signed in to use chat. Please log in and try again.' }, 401);
    }

    let systemPrompt: string;
    try {
      systemPrompt = await getSystemPrompt(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[API] Chat-v3 getSystemPrompt error:', err);
      return jsonResponse({
        error: `Failed to build prompt: ${msg}. Check the terminal for details.`,
      }, 500);
    }
    console.log('[API] Selected model:', selectedModel);
    console.log('[API] OpenRouter API key present:', !!process.env.OPENROUTER_API_KEY?.trim());
    console.log('[API] OpenRouter API key length:', process.env.OPENROUTER_API_KEY?.trim()?.length || 0);

    // Verify the model exists in languageModels before using it
    // This prevents fallback to wrong provider
    let modelInstance;
    try {
      // Check if model is in the languageModels object
      const availableModels = Object.keys((myProvider as any).languageModels || {});
      console.log('[API] Available models count:', availableModels.length);
      console.log('[API] Selected model in available models:', availableModels.includes(selectedModel));
      
      modelInstance = myProvider.languageModel(selectedModel as any);
      console.log('[API] Model instance retrieved:', !!modelInstance);
      if (!modelInstance) {
        console.error('[API] Model instance is null/undefined for:', selectedModel);
        console.error('[API] Available models:', availableModels.slice(0, 10)); // Log first 10
        return jsonResponse({
          error: `Model "${selectedModel}" is not available. Please select a different model from the dropdown.`,
        }, 400);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[API] Model lookup error:', err);
      return jsonResponse({
        error: `Failed to load model "${selectedModel}": ${msg}. Please select a different model.`,
      }, 400);
    }

    console.log('[API] Starting streamText with model:', selectedModel);
    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages,
      tools: {
        querySupabase: querySupabaseTool,
        generateChart: generateChart,
        tavilySearch: tavilySearchTool,
        ragRetrieval: ragRetrievalTool,
        generateImage: generateImage,
        sendHealthReport: sendHealthReport,
      },
      maxSteps: 10, 
      onError: (error) => {
        console.error('[API] streamText onError:', error);
        console.error('[API] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error && error.cause ? error.cause : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
      toolCallStreaming: true,
    });

    // Send real error messages in the stream so the client shows them instead of "An error occurred."
    function getErrorMessage(error: unknown): string {
      console.error('[API] getErrorMessage called with:', error);
      
      if (error instanceof Error) {
        const msg = error.message;
        const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
        console.error('[API] Error message:', msg);
        console.error('[API] Full error object:', errorStr.substring(0, 500));
        
        // Check for status code in error object (OpenAI SDK includes status_code)
        const statusCode = (error as any).statusCode || (error as any).status;
        if (statusCode === 402) {
          return 'OpenRouter: insufficient credits. Add credits at https://openrouter.ai/settings/credits';
        }
        if (statusCode === 401 || statusCode === 403) {
          return 'OpenRouter API key invalid or expired. Check OPENROUTER_API_KEY in .env.local (https://openrouter.ai/keys)';
        }
        if (statusCode === 429) {
          return 'OpenRouter: rate limit exceeded. Wait a moment or add credits at https://openrouter.ai/settings/credits';
        }
        
        // Check error message patterns
        if (/402|credits|insufficient|balance|payment required/i.test(msg)) {
          return 'OpenRouter: insufficient credits. Add credits at https://openrouter.ai/settings/credits';
        }
        if (/401|403|unauthorized|invalid.*key|authentication/i.test(msg)) {
          return 'OpenRouter API key invalid or expired. Check OPENROUTER_API_KEY in .env.local (https://openrouter.ai/keys)';
        }
        if (/429|rate limit|too many requests/i.test(msg)) {
          return 'OpenRouter: rate limit exceeded. Wait a moment or add credits at https://openrouter.ai/settings/credits';
        }
        
        // Check error body for OpenRouter-specific messages
        const errorBody = (error as any).body;
        if (errorBody && typeof errorBody === 'object') {
          const bodyStr = JSON.stringify(errorBody);
          if (/402|credits|insufficient|balance/i.test(bodyStr)) {
            return 'OpenRouter: insufficient credits. Add credits at https://openrouter.ai/settings/credits';
          }
        }
        
        return msg || String(error);
      }
      return String(error);
    }

    return result.toDataStreamResponse({ getErrorMessage });
  } catch (error: unknown) {
    let message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'An unexpected error occurred.';
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
    const full = (cause ? `${message} (${cause})` : message).toLowerCase();
    console.error('[API] Chat-v3 Error:', error);

    // Connection / network errors (Ollama not running, or HF unreachable)
    if (/econnrefused|connect econnrefused|fetch failed|failed to fetch|network error|networkerror|connection refused|socket hang up/i.test(full)) {
      return new Response(
        JSON.stringify({
          error: "Couldn't connect to the model. If you chose BioMistral (local), start Ollama and run 'ollama run biomistral'. Otherwise pick a Groq model (e.g. Llama 3.3 70B Versatile) in the dropdown.",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    // Auth / token errors
    if (/401|403|invalid|api key|unauthorized|expired|revoked|invalid token/i.test(full)) {
      const isHf = /huggingface|hf_token|hf token/i.test(full);
      const isOpenRouter = /openrouter/i.test(full);
      return new Response(
        JSON.stringify({
          error: isHf
            ? 'Hugging Face token invalid or expired. Check HF_TOKEN in .env.local (get a new token from https://huggingface.co/settings/tokens) and restart the dev server.'
            : isOpenRouter
              ? `OpenRouter API key invalid or expired. Check OPENROUTER_API_KEY in .env.local (get a new key from https://openrouter.ai/keys) and restart the dev server. Original: ${message}`
              : `Groq API key invalid or expired. Check GROQ_API_KEY in .env.local (get a new key from https://console.groq.com) and restart the dev server. Original: ${message}`,
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    // Model not found (e.g. HF router doesn't have BioMistral)
    if (/404|not found|model.*not.*available|model not found/i.test(full)) {
      return new Response(
        JSON.stringify({
          error: "BioMistral (Hugging Face) may not be available on Hugging Face's router. Try selecting a Groq model (e.g. Llama 3.3 70B Versatile) in the dropdown, or use BioMistral (local) with Ollama running.",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    // OpenRouter: insufficient credits (402) or rate limit (429)
    if (/402|credits|insufficient|payment required|balance/i.test(full)) {
      return new Response(
        JSON.stringify({
          error: "OpenRouter: insufficient credits or balance. Add credits at https://openrouter.ai/settings/credits and try again.",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    if (/429|rate limit|too many requests/i.test(full)) {
      return new Response(
        JSON.stringify({
          error: "OpenRouter: rate limit exceeded. Wait a moment and try again, or add credits at https://openrouter.ai/settings/credits",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    // Any other error: show message and ask user to check terminal
    return jsonResponse({
      error: `${message} — Open the terminal where you ran 'npm run dev' and look for '[API] Chat-v3 Error:' to see the full cause.`,
    }, 500);
  }
}
