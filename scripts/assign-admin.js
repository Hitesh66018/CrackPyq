const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'SUPER_ADMIN'
    FROM auth.users
    ON CONFLICT (user_id) DO UPDATE SET role = 'SUPER_ADMIN';
  `;

  try {
    await client.query(sql);
    console.log("All existing users have been granted SUPER_ADMIN access!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
