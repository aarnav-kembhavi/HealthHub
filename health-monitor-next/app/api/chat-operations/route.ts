import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createSupabaseServer()
  const { action, data } = await request.json()

  switch (action) {
    case 'fetchConversations':
      return await fetchConversations(supabase, data.userId)
    case 'fetchMessages':
      return await fetchMessages(supabase, data.conversationId, data.userId)
    case 'createConversation':
      return await createConversation(supabase, data.title, data.userId)
    case 'insertMessage':
      return await insertMessage(supabase, data.message, data.conversationId, data.userId)
    case 'updateConversationTimestamp':
      return await updateConversationTimestamp(supabase, data.conversationId, data.userId)
    case 'renameConversation':
      return await renameConversation(supabase, data.conversationId, data.title, data.userId)
    case 'deleteConversation':
      return await deleteConversation(supabase, data.conversationId, data.userId)
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function fetchConversations(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

async function fetchMessages(supabase: any, conversationId: string, userId: string) {
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single()

  if (conversationError || !conversationData) {
    console.log('conversationError', conversationError)
    console.log('conversationData', conversationData)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

async function createConversation(supabase: any, title: string, userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, user_id: userId })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data[0])
}

async function insertMessage(supabase: any, message: any, conversationId: string, userId: string) {
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single()

  if (conversationError || !conversationData) {
    console.log('conversationError', conversationError)
    console.log('conversationData', conversationData)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

async function updateConversationTimestamp(supabase: any, conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

async function renameConversation(supabase: any, conversationId: string, title: string, userId: string) {
  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) {
    console.log('error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

async function deleteConversation(supabase: any, conversationId: string, userId: string) {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) {
    console.log('error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}