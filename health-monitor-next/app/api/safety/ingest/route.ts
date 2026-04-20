import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

/** Proxy for POST /safety/ingest — optional helper for tools and manual tests. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/safety/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[safety/ingest]", e);
    return NextResponse.json({ error: "Failed to forward ingest request" }, { status: 500 });
  }
}
