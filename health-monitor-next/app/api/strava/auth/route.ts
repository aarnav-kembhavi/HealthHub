import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID?.trim()
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/strava/callback`

export async function GET() {
  if (!STRAVA_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Strava is not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in .env.local.' },
      { status: 503 }
    )
  }
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect('/signin')
  }

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&approval_prompt=force&scope=activity:read_all`

  return NextResponse.redirect(stravaAuthUrl)
}
