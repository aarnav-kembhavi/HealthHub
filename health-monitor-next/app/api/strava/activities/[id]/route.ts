import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
  }

  if (tokenData.expires_at < Math.floor(Date.now() / 1000)) {
    const refreshedToken = await refreshStravaToken(tokenData.refresh_token)
    if (!refreshedToken) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
    }
    tokenData.access_token = refreshedToken.access_token
    tokenData.refresh_token = refreshedToken.refresh_token
    tokenData.expires_at = refreshedToken.expires_at

    await supabase.from('strava_tokens').upsert({
      user_id: user.id,
      access_token: refreshedToken.access_token,
      refresh_token: refreshedToken.refresh_token,
      expires_at: refreshedToken.expires_at,
    })
  }

  try {
    const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${params.id}?include_all_efforts=true`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    })

    if (!activityResponse.ok) {
      throw new Error('Failed to fetch detailed activity from Strava')
    }

    const activity = await activityResponse.json()

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching detailed Strava activity:', error)
    return NextResponse.json({ error: 'Failed to fetch detailed activity' }, { status: 500 })
  }
}

async function refreshStravaToken(refreshToken: string) {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
  
    if (!response.ok) {
      return null
    }
  
    return await response.json()
  }
