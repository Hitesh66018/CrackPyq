const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const epCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'exam_papers'
  `);
  console.log('--- EXAM_PAPERS COLUMNS ---');
  console.table(epCols.rows);

  const qCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'questions'
  `);
  console.log('--- QUESTIONS COLUMNS ---');
  console.table(qCols.rows);

  const spCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'source_papers'
  `);
  console.log('--- SOURCE_PAPERS COLUMNS ---');
  console.table(spCols.rows);

  const rows = await pool.query(`SELECT * FROM exam_papers LIMIT 5`);
  console.log('--- EXAM_PAPERS SAMPLE ROWS ---');
  console.table(rows.rows);

  await pool.end();
}

main().catch(console.error);
