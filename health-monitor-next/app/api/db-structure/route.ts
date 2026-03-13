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
    const body = await req.json();
    const db_credentials = {db_credentials: DB_CREDENTIALS}
    const response = await fetch(`${API_URL}/db-structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db_credentials),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch DB structure from FastAPI');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching DB structure:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the database structure' },
      { status: 500 }
    );
  }
}