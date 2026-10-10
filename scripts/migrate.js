const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    -- 1. Create a Roles table and link it to users
    CREATE TABLE IF NOT EXISTS public.user_roles (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CONTENT_ADMIN', 'REVIEWER', 'STUDENT')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id)
    );

    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
    CREATE POLICY "Users can read own role" ON public.user_roles 
    FOR SELECT USING (auth.uid() = user_id);

    -- 2. Upgrade the Questions table with Lifecycle Status & Versioning
    ALTER TABLE public.questions 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED')),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

    -- 3. Upgrade the Exams table for the CMS
    ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'COMING_SOON' CHECK (status IN ('AVAILABLE', 'COMING_SOON', 'UNAVAILABLE')),
    ADD COLUMN IF NOT EXISTS image_url TEXT;

    -- 4. Create an Audit Logs Table for Accountability
    CREATE TABLE IF NOT EXISTS public.audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        table_name VARCHAR(50),
        record_id INTEGER,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;

  try {
    await client.query(sql);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
