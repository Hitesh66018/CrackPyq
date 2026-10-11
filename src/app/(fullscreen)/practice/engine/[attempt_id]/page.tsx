import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ExamEngineClient } from '@/components/exam/ExamEngineClient'
import { db } from '@/utils/db';

export const instant = false;

export default async function ExamEnginePage({ params }: { params: Promise<{ attempt_id: string }> }) {
  const { attempt_id } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    // 1. Fetch Attempt
    const attemptRes = await pool.query("SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2", [attempt_id, user.id]);
    if (attemptRes.rows.length === 0) return redirect('/dashboard');
    const attempt = attemptRes.rows[0];

    // If already submitted, redirect to results
    if (attempt.status !== 'IN_PROGRESS') {
      return redirect(`/analytics/result/${attempt.id}`);
    }

    // 2. Fetch Test
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [attempt.test_id]);
    const test = testRes.rows[0];

    // 3. Fetch Questions
    const questionsRes = await pool.query(`
      SELECT q.id, q.question_text as content, q.question_type, q.positive_marks, q.negative_marks
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      WHERE tq.test_id = $1
      ORDER BY tq.order_num ASC
    `, [test.id]);
    const questions = questionsRes.rows;

    if (questions.length === 0) return redirect('/dashboard?error=EmptyTest');

    // 4. Fetch Options for all questions
    const questionIds = questions.map(q => q.id);
    const optionsRes = await pool.query(`
      SELECT * FROM options WHERE question_id = ANY($1::int[]) ORDER BY id ASC
    `, [questionIds]);
    
    // Attach options to questions
    const questionsWithOptions = questions.map(q => ({
      ...q,
      options: optionsRes.rows.filter(o => o.question_id === q.id).map(o => ({
        id: o.id,
        content: o.option_text
      })) // We DO NOT send is_correct to the client to prevent cheating!
    }));

    // 5. Fetch existing attempt details (if user is resuming)
    const detailsRes = await pool.query("SELECT question_id, selected_option_id, status, is_marked_for_review FROM attempt_details WHERE attempt_id = $1", [attempt.id]);
    
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white">
        <ExamEngineClient 
          attempt={attempt} 
          test={test} 
          questions={questionsWithOptions} 
          savedResponses={detailsRes.rows} 
        />
      </div>
    )
  } finally {
    
  }
}
