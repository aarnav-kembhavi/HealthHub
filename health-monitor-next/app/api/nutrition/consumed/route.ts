import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getUser } from '@/hooks/get-user';

export async function POST(request: Request) {
  try {
    let user;
    try {
      user = await getUser();
    } catch (authError) {
      console.error('[Nutrition Consumed] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 });
    }
    
    if (!user) {
      console.warn('[Nutrition Consumed] No user found');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { daily_nutrition_id, food_name, calories, protein, carbs, fat, image_url } = await request.json();
    
    if (!daily_nutrition_id) {
      return NextResponse.json({ error: 'daily_nutrition_id is required' }, { status: 400 });
    }

    // Verify that the daily_nutrition record belongs to the user
    const supabase = await createSupabaseServer();
    const { data: dailyRecord, error: dailyError } = await supabase
      .from('daily_nutrition')
      .select('user_id')
      .eq('id', daily_nutrition_id)
      .single();

    if (dailyError || !dailyRecord) {
      return NextResponse.json({ error: 'Daily nutrition record not found' }, { status: 404 });
    }

    if (dailyRecord.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: This record does not belong to you' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('consumed_foods')
      .insert({ daily_nutrition_id, food_name, calories, protein, carbs, fat, image_url })
      .select();

    if (error) {
      console.error('Error inserting consumed food:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: updateError } = await supabase.rpc('update_daily_calories', {
      p_daily_nutrition_id: daily_nutrition_id,
      p_calories: calories
    });

    if (updateError) {
      console.error('Error updating daily calories:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/nutrition/consumed:', error);
    return NextResponse.json({ 
      error: 'Failed to add consumed food', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}