const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function syncSeq() {
  await pool.query("SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM topics));");
  console.log('topics_id_seq synced');
  await pool.query("SELECT setval('subjects_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM subjects));");
  console.log('subjects_id_seq synced');
  await pool.query("SELECT setval('exams_id_seq', (SELECT COALESCE(MAX(id), 1) + 1 FROM exams));");
  console.log('exams_id_seq synced');
  await pool.end();
}
syncSeq();
