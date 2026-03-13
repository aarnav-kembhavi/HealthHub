import { Ragie } from 'ragie';

let ragieInstance: Ragie | null = null;

/**
 * Lazy-initialized Ragie client. Only creates when RAGIE_API_KEY is set.
 * Use getRagieClientOrThrow() in routes that require the key.
 */
export function getRagieClient(): Ragie | null {
  const key = process.env.RAGIE_API_KEY?.trim();
  if (!key) return null;
  if (!ragieInstance) {
    ragieInstance = new Ragie({ auth: key });
  }
  return ragieInstance;
}

export function getRagieClientOrThrow(): Ragie {
  const client = getRagieClient();
  if (!client) {
    throw new Error('RAGIE_API_KEY is not set. Add RAGIE_API_KEY in .env.local to use Ragie document retrieval and upload.');
  }
  return client;
}
