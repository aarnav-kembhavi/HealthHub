import { tool } from 'ai';
import { z } from 'zod';
import getTavilyClient from '@/lib/tavily/client';

export const tavilySearchTool = tool({
  description: 'Search the web using Tavily for up-to-date information, news, and research.',
  parameters: z.object({
    query: z.string().describe('The search query to use.'),
  }),
  execute: async ({ query }) => {
    try {
      const tvly = getTavilyClient();
      const searchResult = await tvly.search(query, {
        includeAnswer: true,
        maxResults: 5,
        includeRawContent: false,
        includeImages: true,
      });
      // The result needs to be a JSON string for the client to parse.
      return JSON.stringify(searchResult);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error searching with Tavily:', error);
      if (msg.includes('TAVILY_API_KEY')) {
        return JSON.stringify({ error: 'Tavily search is not configured. Set TAVILY_API_KEY in .env.local to enable web search (optional).' });
      }
      return JSON.stringify({ error: 'Failed to perform search. Please try again.' });
    }
  },
});
