const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function alterConstraint() {
  await pool.query('ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_status_check;');
  await pool.query(`
    ALTER TABLE exams ADD CONSTRAINT exams_status_check 
    CHECK (status IN ('AVAILABLE', 'COMING_SOON', 'UNAVAILABLE', 'PLANNED', 'CONFIGURING', 'READY_FOR_IMPORT', 'CONTENT_AVAILABLE'));
  `);
  console.log('Constraint updated successfully');
  await pool.end();
}
alterConstraint();
