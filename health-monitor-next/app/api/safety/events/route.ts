import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "100";
    const response = await fetch(`${API_URL}/safety/events?limit=${encodeURIComponent(limit)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err || "Upstream error" }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[safety/events]", e);
    return NextResponse.json({ error: "Failed to fetch safety events" }, { status: 500 });
  }
}
