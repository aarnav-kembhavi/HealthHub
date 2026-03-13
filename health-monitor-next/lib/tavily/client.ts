import { tavily } from "@tavily/core";

let tvlyInstance: ReturnType<typeof tavily> | null = null;

function getTavilyClient() {
  if (!tvlyInstance) {
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not set. Tavily search tool requires TAVILY_API_KEY in .env.local (optional - tool will be disabled if not set).');
    }
    tvlyInstance = tavily({ apiKey });
  }
  return tvlyInstance;
}

export default getTavilyClient;
