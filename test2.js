const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  const fkeys = await pool.query("SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE c.conname = 'user_roles_user_id_fkey'");
  console.log(fkeys.rows);
  process.exit();
}
check();
