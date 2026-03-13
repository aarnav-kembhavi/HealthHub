import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID?.trim()
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET?.trim()
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/strava/callback`
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/activities?error=missing_code`)
  }
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/activities?error=strava_not_configured`)
  }

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${BASE_URL}/signin`)
  }

  try {
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    await supabase.from('strava_tokens').upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    })

    return NextResponse.redirect(`${BASE_URL}/activities`)
  } catch (error) {
    console.error('Error exchanging Strava code for token:', error)
    return NextResponse.redirect(`${BASE_URL}/activities?error=token_exchange_failed`)
  }
}
