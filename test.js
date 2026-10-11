const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  const res = await pool.query("SELECT constraint_name, table_schema, table_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'user_roles'");
  console.log(res.rows);
  const fkeys = await pool.query("SELECT * FROM information_schema.key_column_usage WHERE table_name = 'user_roles'");
  console.log(fkeys.rows);
  
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(tables.rows);
  
  process.exit();
}
check();
