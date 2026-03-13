import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getUser } from '@/hooks/get-user';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    let user;
    try {
      user = await getUser();
    } catch (authError) {
      console.error('[Nutrition Consumed DELETE] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 });
    }
    
    if (!user) {
      console.warn('[Nutrition Consumed DELETE] No user found');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'No ID provided for deletion' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    
    // Fetch the food item and verify it belongs to the user via daily_nutrition
    const { data: foodData, error: foodError } = await supabase
      .from('consumed_foods')
      .select('*, daily_nutrition!inner(user_id)')
      .eq('id', id)
      .single();

    if (foodError) {
      console.error('Error fetching food item:', foodError);
      return NextResponse.json({ error: foodError.message }, { status: 400 });
    }

    if (!foodData) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Verify ownership through daily_nutrition
    const dailyNutrition = foodData.daily_nutrition as any;
    if (dailyNutrition?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: This food item does not belong to you' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('consumed_foods')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting food item:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    const { error: updateError } = await supabase.rpc('update_daily_calories', {
      p_daily_nutrition_id: foodData.daily_nutrition_id,
      p_calories: -foodData.calories 
    });

    if (updateError) {
      console.error('Error updating daily calories:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/nutrition/consumed/[id]:', error);
    return NextResponse.json({ 
      error: 'Failed to delete consumed food', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}