import { z } from 'zod';
import { tool } from 'ai';

// Image generation is not available with Groq-only setup (Groq does not offer image generation).
// This tool returns a friendly message so the chat flow continues to work.
export const generateImage = tool({
  description:
    'Generate an image based on a textual prompt. Note: Image generation is disabled when using Groq-only LLMs.',
  parameters: z.object({
    prompt: z.string().describe('The prompt for the image generation.'),
  }),
  execute: async ({ prompt }) => {
    return {
      error:
        'Image generation is not available in this setup. This app uses Groq for LLMs only; image generation would require a separate provider (e.g. OpenAI or Google).',
      prompt,
    };
  },
});
