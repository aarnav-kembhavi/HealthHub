import { tool } from 'ai';
import { z } from 'zod';
import { getRagieClient } from '@/lib/ragie/client';

export const ragRetrievalTool = tool({
  description: 'Retrieve information from uploaded documents (requires Ragie to be configured with RAGIE_API_KEY).',
  parameters: z.object({
    query: z.string().describe('The query to search for in the documents.'),
  }),
  execute: async ({ query }) => {
    try {
      const ragie = getRagieClient();
      if (!ragie) {
        return { error: 'Ragie is not configured. Set RAGIE_API_KEY in .env.local to use document retrieval.' };
      }

      const response = await ragie.retrievals.retrieve({ query });

      const chunks = response.scoredChunks?.map(
        (chunk: { text: string; documentName: string }) => ({
          text: chunk.text,
          documentName: chunk.documentName,
        })
      ) ?? [];

      return { chunks };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[RAG Tool] Error:', error);
      return { error: msg.includes('auth') || msg.includes('API') ? 'Ragie API error. Check RAGIE_API_KEY in .env.local.' : 'Retrieval failed. Try again.' };
    }
  },
});
