import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, llm_choice, match_count, user_id } = body;

  try {
    const response = await fetch(`${API_URL}/rag-query-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, llm_choice, match_count, user_id}),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from RAG query');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RAG query error:', error);
    return NextResponse.json({ error: 'An error occurred during the RAG query' }, { status: 500 });
  }
}