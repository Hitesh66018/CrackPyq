import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/utils/db';

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { attempt_id, question_id, selected_option_id, status, is_marked_for_review, selected_options_array, answer_text, time_spent_seconds } = body

  const pool = db;
  
  try {
    // Upsert response
    await pool.query(`
      INSERT INTO attempt_details (attempt_id, question_id, selected_option_id, status, is_marked_for_review, selected_options_array, answer_text, time_spent_seconds)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET 
        selected_option_id = EXCLUDED.selected_option_id,
        status = EXCLUDED.status,
        is_marked_for_review = EXCLUDED.is_marked_for_review,
        selected_options_array = EXCLUDED.selected_options_array,
        answer_text = EXCLUDED.answer_text,
        time_spent_seconds = attempt_details.time_spent_seconds + EXCLUDED.time_spent_seconds
    `, [
      attempt_id, 
      question_id, 
      selected_option_id || null, 
      status, 
      is_marked_for_review, 
      selected_options_array ? `{${selected_options_array.join(',')}}` : null, 
      answer_text || null,
      time_spent_seconds || 0
    ]);
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    
  }
}
