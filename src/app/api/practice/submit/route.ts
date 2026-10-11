import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/utils/db';

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { attempt_id } = body

  const pool = db;
  
  try {
    // 1. Get Attempt and verify ownership
    const attemptRes = await pool.query("SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2", [attempt_id, user.id]);
    if (attemptRes.rows.length === 0) throw new Error("Attempt not found");
    const attempt = attemptRes.rows[0];

    // 2. Fetch all questions
    const questionsRes = await pool.query(`
      SELECT q.id, q.question_type, q.positive_marks, q.negative_marks, q.nat_answer_min, q.nat_answer_max
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      WHERE tq.test_id = $1
    `, [attempt.test_id]);
    
    // Fetch correct options mapping
    const optionsRes = await pool.query(`
      SELECT question_id, id as option_id
      FROM options
      WHERE question_id = ANY($1::int[]) AND is_correct = true
    `, [questionsRes.rows.map((q: any) => q.id)]);

    const correctOptionsMap: Record<number, number[]> = {};
    optionsRes.rows.forEach((o: any) => {
      if (!correctOptionsMap[o.question_id]) correctOptionsMap[o.question_id] = [];
      correctOptionsMap[o.question_id].push(o.option_id);
    });
    
    // 3. Fetch student's responses
    const responsesRes = await pool.query("SELECT * FROM attempt_details WHERE attempt_id = $1", [attempt.id]);

    // 4. Evaluate
    let totalScore = 0;
    
    await pool.query('BEGIN');
    
    for (const res of responsesRes.rows) {
      const q = questionsRes.rows.find((x: any) => x.id === res.question_id);
      if (!q) continue;

      const isAnswered = res.selected_option_id || 
                         (res.selected_options_array && res.selected_options_array.length > 0) || 
                         (res.answer_text && res.answer_text.trim() !== '');

      if (isAnswered) {
        let isCorrect = false;

        if (q.question_type === 'MCQ') {
          const correctId = correctOptionsMap[q.id]?.[0];
          isCorrect = res.selected_option_id === correctId;
        } 
        else if (q.question_type === 'MSQ') {
          const correctIds = correctOptionsMap[q.id] || [];
          const selected = res.selected_options_array || [];
          // True if same length and every selected is in correctIds
          isCorrect = selected.length > 0 && 
                      selected.length === correctIds.length && 
                      selected.every((id: number) => correctIds.includes(id));
        } 
        else if (q.question_type === 'NAT') {
          const val = parseFloat(res.answer_text);
          if (!isNaN(val)) {
            const min = parseFloat(q.nat_answer_min) || 0;
            const max = parseFloat(q.nat_answer_max) || 0;
            isCorrect = val >= min && val <= max;
          }
        }

        const marks = isCorrect ? Number(q.positive_marks) : -Number(q.negative_marks);
        totalScore += marks;
        
        await pool.query(
          "UPDATE attempt_details SET is_correct = $1, marks_obtained = $2 WHERE id = $3", 
          [isCorrect, marks, res.id]
        );
      }
    }

    // 5. Finalize attempt
    await pool.query(`
      UPDATE test_attempts 
      SET status = 'SUBMITTED', end_time = NOW(), total_score = $1 
      WHERE id = $2
    `, [totalScore, attempt.id]);

    await pool.query('COMMIT');

    return NextResponse.json({ success: true, score: totalScore })
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Submit error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    
  }
}
