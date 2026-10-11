import { Pool } from 'pg';

const connectionString = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

// Prevent multiple pools from being created during hot-reloads in development
let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 20, // Max number of connections in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  if (!(global as any).pgPool) {
    (global as any).pgPool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  pool = (global as any).pgPool;
}

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};
