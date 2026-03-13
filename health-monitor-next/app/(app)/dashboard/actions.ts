"use server"

import { createSupabaseServer } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getHealthRecords(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export async function getNutritionLogs(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('daily_nutrition')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  return data
}

export async function getStravaActivities(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(30)
  
  if (error) throw error
  return data
}

export async function getHealthReports(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('health_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) throw error
  return data
}

export async function getSensorData(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('sensor_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

export async function getConsumedFoods(userId: string) {
  noStore()
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('consumed_foods')
    .select(`
      *,
      daily_nutrition!inner(user_id)
    `)
    .eq('daily_nutrition.user_id', userId)
    .order('consumed_at', { ascending: false })
    .limit(100)
  
  if (error) throw error
  return data
} 