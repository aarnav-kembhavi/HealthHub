import { NextResponse } from 'next/server';

const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID?.trim();
const NUTRITIONIX_API_KEY = process.env.NUTRITIONIX_API_KEY?.trim();

export async function POST(request: Request) {
  if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_API_KEY) {
    return NextResponse.json(
      { error: 'Nutritionix is not configured. Set NUTRITIONIX_APP_ID and NUTRITIONIX_API_KEY in .env.local.' },
      { status: 503 }
    );
  }

  const { query, type } = await request.json();
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const baseUrl = 'https://trackapi.nutritionix.com/v2';
  const endpoint = type === 'instant' ? '/search/instant' : '/natural/nutrients';
  const method = type === 'instant' ? 'GET' : 'POST';

  const url = new URL(`${baseUrl}${endpoint}`);
  if (type === 'instant') {
    url.searchParams.append('query', query);
  }

  try {
    console.log('[Nutritionix] Making request:', { url: url.toString(), method, type, query });
    console.log('[Nutritionix] API keys present:', { appId: !!NUTRITIONIX_APP_ID, apiKey: !!NUTRITIONIX_API_KEY });
    
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': NUTRITIONIX_APP_ID!,
        'x-app-key': NUTRITIONIX_API_KEY!,
      },
      body: type === 'instant' ? undefined : JSON.stringify({ query }),
    });

    console.log('[Nutritionix] Response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('[Nutritionix] Response text (first 500 chars):', responseText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Nutritionix] Failed to parse response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from Nutritionix API', details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[Nutritionix] API error:', data);
      return NextResponse.json(
        { error: data.message || data.error || 'Nutritionix API request failed', details: data },
        { status: response.status }
      );
    }
    
    console.log('[Nutritionix] Success. Response keys:', Object.keys(data));
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Nutritionix] Error calling API:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Nutritionix API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
