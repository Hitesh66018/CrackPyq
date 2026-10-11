const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function audit() {
  try {
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('--- ALL PUBLIC TABLES ---');
    console.log(tables.rows.map(r => r.table_name));

    console.log('\n--- EXAMS & CATEGORIES ---');
    const exams = await pool.query('SELECT * FROM exams LIMIT 10;');
    console.log('Exams:', exams.rows);
    const categories = await pool.query('SELECT * FROM categories LIMIT 10;');
    console.log('Categories:', categories.rows);

    console.log('\n--- SUBJECTS & TOPICS ---');
    const subjects = await pool.query('SELECT * FROM subjects LIMIT 10;');
    console.log('Subjects:', subjects.rows);
    const topics = await pool.query('SELECT * FROM topics LIMIT 10;');
    console.log('Topics:', topics.rows);

    console.log('\n--- RECENT QUESTIONS (TOP 5) ---');
    const questions = await pool.query('SELECT id, topic_id, question_text, question_type, status, created_at FROM questions ORDER BY id DESC LIMIT 5;');
    console.log('Recent Questions:', questions.rows);

    console.log('\n--- SOURCE PAPERS & IMPORT JOBS ---');
    const papers = await pool.query('SELECT * FROM source_papers ORDER BY id DESC LIMIT 5;');
    console.log('Source Papers:', papers.rows);
    const jobs = await pool.query('SELECT * FROM import_jobs ORDER BY id DESC LIMIT 5;');
    console.log('Import Jobs:', jobs.rows);

    console.log('\n--- PAPER QUESTIONS (TOP 5) ---');
    const paperQuestions = await pool.query('SELECT * FROM paper_questions ORDER BY id DESC LIMIT 5;');
    console.log('Paper Questions:', paperQuestions.rows);

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await pool.end();
  }
}

audit();
