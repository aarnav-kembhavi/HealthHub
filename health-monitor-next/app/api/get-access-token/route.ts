const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY?.trim();

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'HeyGen is not configured. Set HEYGEN_API_KEY in .env.local (get a key from https://www.heygen.com).' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: {
          "x-api-key": HEYGEN_API_KEY,
        },
      },
    );
    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || data?.message || 'HeyGen API error';
      return new Response(
        JSON.stringify({ error: msg }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = data?.data?.token;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token in HeyGen response' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(token, { status: 200 });
  } catch (error) {
    console.error("Error retrieving HeyGen access token:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve HeyGen access token. Check HEYGEN_API_KEY in .env.local.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}