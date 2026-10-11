const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const qs = await pool.query(`
    SELECT q.id, q.status, q.topic_id, q.exam_year, t.name as topic_name, s.name as subject_name, e.id as exam_id, e.name as exam_name
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN exams e ON s.exam_id = e.id
    ORDER BY q.id DESC
    LIMIT 15
  `);
  console.log('--- RECENT QUESTIONS IN DB ---');
  console.table(qs.rows);

  const pq = await pool.query(`
    SELECT pq.source_paper_id, pq.question_id, pq.question_number, sp.paper_title, sp.exam_id
    FROM paper_questions pq
    JOIN source_papers sp ON pq.source_paper_id = sp.id
    ORDER BY pq.question_id DESC
    LIMIT 10
  `);
  console.log('--- RECENT PAPER_QUESTIONS ---');
  console.table(pq.rows);

  await pool.end();
}

main().catch(console.error);
