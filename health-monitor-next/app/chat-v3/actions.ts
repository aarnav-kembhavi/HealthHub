'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { type Message } from 'ai'

export async function saveMessages(messages: Message[], conversationId: string) {
  if (!messages?.length) return

  try {
    const supabase = await createSupabaseServer()

    const messagesToInsert = messages.map((message) => ({
      conversation_id: conversationId,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? ''),
      role: message.role,
      tool_invocations: message.toolInvocations ?? [],
    }))

    const { error } = await supabase.from('messages').insert(messagesToInsert)

    if (error) {
      console.error('Error saving messages:', error.message, error.code)
      // Don't throw — chat still works; persistence is best-effort
      return
    }
  } catch (err) {
    console.error('Error saving messages:', err)
    // Don't throw — avoid breaking the chat UI when DB/table is missing or RLS blocks
  }
}
