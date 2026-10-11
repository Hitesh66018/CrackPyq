import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/utils/db';

export async function GET(req: NextRequest) {
  const test_id = req.nextUrl.searchParams.get('test_id')
  
  if (!test_id) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const pool = db;
  
  try {
    // Check if test exists and get its duration
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1 AND status = 'PUBLISHED'", [test_id]);
    
    if (testRes.rows.length === 0) {
      return NextResponse.redirect(new URL('/dashboard?error=TestNotFound', req.url))
    }
    
    const test = testRes.rows[0];
    const durationMins = test.duration_minutes || 180;
    
    // PREVENT DUPLICATES: Check if an IN_PROGRESS attempt already exists
    const existingRes = await pool.query(
      "SELECT id FROM test_attempts WHERE user_id = $1 AND test_id = $2 AND status = 'IN_PROGRESS'", 
      [user.id, test_id]
    );
    
    if (existingRes.rows.length > 0) {
      // Resume existing attempt instead of creating a new one
      return NextResponse.redirect(new URL(`/practice/engine/${existingRes.rows[0].id}`, req.url))
    }
    
    // Insert a new attempt
    // deadline = NOW() + duration
    const insertRes = await pool.query(`
      INSERT INTO test_attempts (user_id, test_id, exam_id, start_time, deadline, status) 
      VALUES ($1, $2, $3, NOW(), NOW() + interval '${durationMins} minutes', 'IN_PROGRESS') 
      RETURNING id
    `, [user.id, test_id, test.exam_id]);
    
    const attempt_id = insertRes.rows[0].id;
    
    // Redirect to the actual engine
    return NextResponse.redirect(new URL(`/practice/engine/${attempt_id}`, req.url))

  } catch (error) {
    console.error("Error creating attempt:", error);
    return NextResponse.redirect(new URL('/dashboard?error=EngineInitFailed', req.url))
  } finally {
    
  }
}
