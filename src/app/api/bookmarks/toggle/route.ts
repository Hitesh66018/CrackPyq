import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/utils/db';

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { question_id } = body

  const pool = db;
  
  try {
    const checkRes = await pool.query("SELECT id FROM bookmarks WHERE user_id = $1 AND question_id = $2", [user.id, question_id]);
    
    if (checkRes.rows.length > 0) {
      await pool.query("DELETE FROM bookmarks WHERE user_id = $1 AND question_id = $2", [user.id, question_id]);
      return NextResponse.json({ bookmarked: false })
    } else {
      await pool.query("INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2)", [user.id, question_id]);
      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    
  }
}
