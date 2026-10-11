const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const sql = fs.readFileSync('scripts/migrations/fix_metadata_and_ors.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration fix_metadata_and_ors.sql applied successfully!');
  await pool.end();
}

run().catch(console.error);
