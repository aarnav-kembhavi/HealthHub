'use server';

import { Message } from './types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export async function generateChatName(messages: Message[]): Promise<string> {
  const firstUserMessage =
    messages.find((msg) => msg.role === 'user')?.content || '';

  if (firstUserMessage.length < 3) {
    return 'New Chat';
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const words = firstUserMessage.split(' ').slice(0, 3).join(' ');
    return words.length > 25 ? `${words.slice(0, 25)}...` : words;
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              "Generate a short, concise title (max 6 words) for a chat conversation based on the user's first message. Respond with only the title, no quotes or punctuation.",
          },
          { role: 'user', content: firstUserMessage },
        ],
        temperature: 0.7,
        max_tokens: 20,
      }),
    });

    if (!res.ok) {
      throw new Error('Groq API error');
    }

    const data = await res.json();
    const title = data.choices?.[0]?.message?.content?.trim() || '';
    return title || 'New Chat';
  } catch {
    const words = firstUserMessage.split(' ').slice(0, 3).join(' ');
    return words.length > 25 ? `${words.slice(0, 25)}...` : words;
  }
}
