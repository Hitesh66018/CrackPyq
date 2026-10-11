const { Client } = require('pg');
const c = new Client('postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');
c.connect()
  .then(() => c.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;"))
  .then(r => {
    const tables = [...new Set(r.rows.map(d=>d.table_name))];
    console.log(tables.join(', '));
  })
  .finally(() => c.end());
