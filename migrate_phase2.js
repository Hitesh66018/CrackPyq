const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function migrate() {
  try {
    // 1. Update test_attempts
    await pool.query(`
      ALTER TABLE test_attempts 
      ADD COLUMN IF NOT EXISTS test_id INTEGER REFERENCES tests(id),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'IN_PROGRESS',
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS score_positive NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS score_negative NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS score_unanswered NUMERIC DEFAULT 0;
    `);
    console.log("Updated test_attempts");

    // 2. Update attempt_details
    await pool.query(`
      ALTER TABLE attempt_details
      ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'NOT_VISITED',
      ADD COLUMN IF NOT EXISTS is_marked_for_review BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS answer_text TEXT,
      ADD COLUMN IF NOT EXISTS selected_options_array INTEGER[],
      ADD COLUMN IF NOT EXISTS marks_obtained NUMERIC DEFAULT 0;
    `);
    console.log("Updated attempt_details");

    // 3. Update questions table to support question_type (MCQ, MSQ, NAT)
    await pool.query(`
      ALTER TABLE questions
      ADD COLUMN IF NOT EXISTS question_type VARCHAR(10) DEFAULT 'MCQ',
      ADD COLUMN IF NOT EXISTS nat_answer_min NUMERIC,
      ADD COLUMN IF NOT EXISTS nat_answer_max NUMERIC,
      ADD COLUMN IF NOT EXISTS positive_marks NUMERIC DEFAULT 1,
      ADD COLUMN IF NOT EXISTS negative_marks NUMERIC DEFAULT 0;
    `);
    console.log("Updated questions");

  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    pool.end();
  }
}

migrate();
