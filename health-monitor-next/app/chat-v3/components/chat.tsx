"use client";

import { useChat } from '@ai-sdk/react'; // Update import to support RSC and handle streamed UI components
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { ChatHeader } from "./chat-header";
import { Message } from "ai";
import { saveMessages } from "../actions";
import { useState, useEffect, useMemo } from "react";
import { models } from "@/lib/ai/providers";
import { toast } from "sonner";

interface ChatProps {
  id: string;
  initialMessages?: Message[];
}

export function Chat({ id, initialMessages = [] }: ChatProps) {
  // Get default model (OpenRouter if available, otherwise Groq)
  // Memoize the default model calculation to prevent infinite loops
  const getDefaultModel = useMemo(() => {
    // Check if OpenRouter models are available (they'll be first in the list if API key is set)
    if (models.length > 0 && (models[0].value.includes('openai/') || models[0].value.includes('anthropic/') || models[0].value.includes('google/') || models[0].value.includes('meta-llama/'))) {
      return models[0].value;
    }
    return 'llama-3.3-70b-versatile';
  }, []);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    return models[0]?.value ?? getDefaultModel;
  });

  const customFetch: typeof fetch = async (input, init) => {
    const res = await fetch(input, init);
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const text = await res.text();
        if (text) {
          const json = JSON.parse(text);
          if (json?.error && typeof json.error === 'string') message = json.error;
          else if (!text.startsWith('<')) message = text.slice(0, 200);
        }
      } catch {
        // keep default message
      }
      throw new Error(message);
    }
    return res;
  };

  const { messages, input, setInput, handleInputChange, handleSubmit, status, data, append, error } = useChat({
    initialMessages,
    api: '/api/chat-v3',
    fetch: customFetch,
    onFinish: async (message) => {
      // Save the completed assistant message
      if (message.role === 'assistant') {
        await saveMessages([message], id);
      }
    },
    onError: async (err) => {
      console.error("Error fetching response:", err);
      // Prefer cause message (e.g. from API) when top-level is generic
      const causeMsg = err instanceof Error && err.cause instanceof Error ? (err.cause as Error).message : "";
      const msg = err?.message ?? "Chat request failed.";
      const display = (causeMsg && msg === "An error occurred.") ? causeMsg : msg;
      toast.error(display);
    },
    experimental_prepareRequestBody: (body) => {
      return {
        ...body,
        selectedModel,
      };
    },
  });

  useEffect(() => {
    if (error) {
      const causeMsg = error.cause instanceof Error ? (error.cause as Error).message : "";
      const display = (causeMsg && error.message === "An error occurred.") ? causeMsg : error.message;
      toast.error(display);
    }
  }, [error]);

  // Custom submit handler to make chat feel snappy
  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    // Append message to UI and send to API
    append(userMessage);

    // Clear input
    setInput('');

    // Save message to DB in background
    saveMessages([userMessage], id);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-background">
      <ChatHeader chatId={id} />
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="mx-auto max-w-3xl px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error.cause instanceof Error && error.message === "An error occurred."
              ? (error.cause as Error).message
              : error.message}
            {error.message === "An error occurred." && !(error.cause instanceof Error) && (
              <span className="block mt-1 opacity-80">Check the browser console (F12) and the terminal running &quot;npm run dev&quot; for details.</span>
            )}
          </div>
        )}
        <Messages
          isLoading={status === 'submitted'}
          messages={messages}
        />
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-background to-transparent">
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <MultimodalInput
            chatId={id}
            messages={messages}
            append={append}
            value={input}
            onChange={handleInputChange}
            handleSubmit={customHandleSubmit}
            isLoading={status === 'submitted'}
            modelState={{
              selectedModel,
              setSelectedModel,
            }}
          />
        </div>
      </div>
    </div>
  );
}
