import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
    const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    })

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch activities from Strava')
    }

    const activities = await activitiesResponse.json()
    console.log(activities)

    const { error: insertError } = await supabase.from('strava_activities').upsert(
      activities.map((activity: any) => ({
        id: activity.id,
        user_id: user.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
        strava_activity_id: activity.id,
        max_heartrate: activity.max_heartrate,
        average_heartrate: activity.average_heartrate,
        average_speed: activity.average_speed,
        calories: activity.calories,
      })),
      { onConflict: 'id' }
    )

    if (insertError) {
      console.error('Error inserting activities:', insertError)
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching Strava activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

async function refreshStravaToken(refreshToken: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID?.trim(),
      client_secret: process.env.STRAVA_CLIENT_SECRET?.trim(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    return null
  }

  return await response.json()
}
