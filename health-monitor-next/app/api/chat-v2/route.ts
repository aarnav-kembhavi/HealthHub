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
    const { messages, llm_choice } = await req.json();
    console.log('Sending to backend:', { messages, llm_choice });

    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages, 
        db_credentials: DB_CREDENTIALS, 
        llm_choice 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from backend');
    }

    const data = await response.json();
    console.log('Received from backend:', data);

    return NextResponse.json({
      role: 'assistant',
      content: data.response || data.content,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' }, 
      { status: 500 }
    );
  }
}