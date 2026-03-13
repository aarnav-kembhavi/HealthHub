import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:8000';
const DB_CREDENTIALS = {
  db_user: process.env.DB_USER,
  db_password: process.env.DB_PASSWORD,
  db_host: process.env.DB_HOST,
  db_port: process.env.DB_PORT,
  db_name: process.env.DB_NAME,
};

export async function POST(req: NextRequest) {
  try {
    const { 
      messages, 
      llm_choice, 
      conversationId, 
      query, 
      match_count = 5, 
      user_id 
    } = await req.json();
    
    console.log('Sending to RAG v2 backend:', { 
      llm_choice, 
      conversationId, 
      query 
    });

    const response = await fetch(`${API_URL}/rag-query-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        llm_choice,
        match_count,
        user_id,
        db_credentials: DB_CREDENTIALS,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from RAG v2');
    }

    const data = await response.json();
    console.log('Received from RAG v2:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('RAG v2 query error:', error);
    return NextResponse.json(
      { error: 'An error occurred during the RAG v2 query' }, 
      { status: 500 }
    );
  }
} 