import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getUser } from '@/hooks/get-user';

export async function POST(request: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch (authError) {
      console.error('[Nutrition Daily POST] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 });
    }
    
    if (!user) {
      console.warn('[Nutrition Daily POST] No user found');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { date, total_calories } = await request.json();
    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from('daily_nutrition')
      .upsert({ user_id: user.id, date, total_calories: total_calories || 0 }, { onConflict: 'user_id,date' })
      .select();

    if (error) {
      console.error('Error creating/updating daily nutrition:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data[0]);  
  } catch (error) {
    console.error('Error in POST /api/nutrition/daily:', error);
    return NextResponse.json({ 
      error: 'Failed to create daily nutrition record', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch (authError) {
      console.error('[Nutrition Daily] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 });
    }
    
    if (!user) {
      console.warn('[Nutrition Daily] No user found');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    
    console.log('[Nutrition Daily] User authenticated:', user.id);

    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('daily_nutrition')
      .select('*, consumed_foods(*)')
      .eq('user_id', user.id);

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (startDate) { // Fetch from startDate onwards if no endDate
      query = query.gte('date', startDate);
    } else if (endDate) { // Fetch up to endDate if no startDate (less common for this use case)
      query = query.lte('date', endDate);
    } else {
      // If no date range, perhaps default to today or return error? For now, let's expect a range or specific date.
      // For this specific revamp, we'll ensure frontend sends a range.
      // However, if a single 'date' param is provided (legacy or specific use case), handle it:
      const singleDate = searchParams.get('date');
      if (singleDate) {
        query = query.eq('date', singleDate);
        const { data, error } = await query.single();
        if (error) {
          if (error.code === 'PGRST116') { // Not found
            return NextResponse.json(null, { status: 404 });
          }
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(data);
      }
      // If no date, startDate, or endDate, it's an invalid request for range fetching
      return NextResponse.json({ error: 'Missing date, or startDate and endDate for range' }, { status: 400 });
    }

    query = query.order('date', { ascending: true }); // Ensure data is ordered for charts

    const { data, error } = await query;

    if (error) {
      console.error('[Nutrition Daily] Error fetching daily nutrition:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('[Nutrition Daily] Fetched records:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('[Nutrition Daily] First record sample:', {
        date: data[0].date,
        consumed_foods_count: data[0].consumed_foods?.length || 0,
        consumed_foods: data[0].consumed_foods?.slice(0, 2) || []
      });
    }

    // If data is null (no records found for the range), return an empty array or null based on preference.
    // Empty array is often better for frontend to map over.
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/nutrition/daily:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch daily nutrition data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}