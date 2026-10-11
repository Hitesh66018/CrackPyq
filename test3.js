const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  const users = await pool.query("SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5");
  console.log(users.rows);
  process.exit();
}
check();
