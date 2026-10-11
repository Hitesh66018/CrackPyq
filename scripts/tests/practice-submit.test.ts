import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/practice/submit/route';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';

describe('POST /api/practice/submit', () => {
  let pool: Pool;
  let testUserId = '';
  let testAttemptId = -1;
  let examId = -1;
  let testId = -1;
  let qMcqId = -1;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
    });

    const client = await pool.connect();
    try {
      // 1. Get a User ID
      const userRes = await client.query("SELECT id FROM auth.users LIMIT 1");
      if (userRes.rows.length > 0) testUserId = userRes.rows[0].id;
      else throw new Error("No users found");

      // 2. Setup Exam, Test, Question
      const examRes = await client.query("INSERT INTO exams (title, description, status) VALUES ('Test Exam', 'Desc', 'PUBLISHED') RETURNING id");
      examId = examRes.rows[0].id;

      const testRes = await client.query("INSERT INTO tests (exam_id, title, duration_minutes, status) VALUES ($1, 'Unit Test', 60, 'PUBLISHED') RETURNING id", [examId]);
      testId = testRes.rows[0].id;

      const qRes = await client.query("INSERT INTO questions (topic_id, question_text, question_type, positive_marks, negative_marks, status) VALUES (1, 'Unit Test MCQ?', 'MCQ', 2, 1, 'PUBLISHED') RETURNING id");
      qMcqId = qRes.rows[0].id;

      await client.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, 'Correct', true), ($1, 'Wrong', false)", [qMcqId]);
      const optRes = await client.query("SELECT id FROM options WHERE question_id = $1 AND is_correct = true", [qMcqId]);
      const correctOptId = optRes.rows[0].id;

      await client.query("INSERT INTO test_questions (test_id, question_id, order_num) VALUES ($1, $2, 1)", [testId, qMcqId]);

      const attemptRes = await client.query("INSERT INTO test_attempts (user_id, test_id, status, deadline) VALUES ($1, $2, 'IN_PROGRESS', NOW() + INTERVAL '60 minutes') RETURNING id", [testUserId, testId]);
      testAttemptId = attemptRes.rows[0].id;

      // Mock answered question correctly
      await client.query("INSERT INTO attempt_details (attempt_id, question_id, selected_option_id, status) VALUES ($1, $2, $3, 'ANSWERED')", [testAttemptId, qMcqId, correctOptId]);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    const client = await pool.connect();
    try {
      if (testAttemptId !== -1) {
        await client.query("DELETE FROM attempt_details WHERE attempt_id = $1", [testAttemptId]);
        await client.query("DELETE FROM test_attempts WHERE id = $1", [testAttemptId]);
      }
      if (testId !== -1) {
        await client.query("DELETE FROM test_questions WHERE test_id = $1", [testId]);
        await client.query("DELETE FROM tests WHERE id = $1", [testId]);
      }
      if (examId !== -1) await client.query("DELETE FROM exams WHERE id = $1", [examId]);
      if (qMcqId !== -1) {
        await client.query("DELETE FROM options WHERE question_id = $1", [qMcqId]);
        await client.query("DELETE FROM questions WHERE id = $1", [qMcqId]);
      }
    } finally {
      client.release();
      await pool.end();
    }
  });

  it('should successfully submit the test and return score and correct boolean', async () => {
    const req = new NextRequest('http://localhost:3000/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: testAttemptId }),
    });

    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const client = await pool.connect();
    try {
      const result = await client.query("SELECT total_score, status FROM test_attempts WHERE id = $1", [testAttemptId]);
      expect(result.rows[0].status).toBe('SUBMITTED');
      expect(Number(result.rows[0].total_score)).toBe(2);
    } finally {
      client.release();
    }
  });
});
