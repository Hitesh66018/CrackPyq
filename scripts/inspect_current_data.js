const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const exams = await pool.query('SELECT id, name, code, status FROM exams ORDER BY id');
  console.log('--- EXAMS ---');
  console.table(exams.rows);

  const qCount = await pool.query(`
    SELECT q.status, s.exam_id, e.name as exam_name, t.name as topic_name, COUNT(*) as cnt
    FROM questions q 
    LEFT JOIN topics t ON q.topic_id = t.id 
    LEFT JOIN subjects s ON t.subject_id = s.id 
    LEFT JOIN exams e ON s.exam_id = e.id 
    GROUP BY q.status, s.exam_id, e.name, t.name
  `);
  console.log('--- QUESTIONS BREAKDOWN ---');
  console.table(qCount.rows);

  const papers = await pool.query(`
    SELECT id, exam_id, paper_year, paper_name, paper_code 
    FROM exam_papers 
    WHERE paper_year = 2013 OR exam_id = 4
    ORDER BY paper_year DESC
    LIMIT 10
  `);
  console.log('--- EXAM PAPERS ---');
  console.table(papers.rows);

  const sources = await pool.query(`
    SELECT id, paper_title, exam_id, exam_paper_id, status, total_questions, extracted_count 
    FROM source_papers 
    ORDER BY id DESC LIMIT 5
  `);
  console.log('--- RECENT SOURCE PAPERS ---');
  console.table(sources.rows);

  await pool.end();
}

main().catch(console.error);
