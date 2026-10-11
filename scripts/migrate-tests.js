const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    -- 1. Create Tests Table
    CREATE TABLE IF NOT EXISTS public.tests (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES public.exams(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        instructions TEXT,
        duration_minutes INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 2. Create Test Questions Mapping Table
    CREATE TABLE IF NOT EXISTS public.test_questions (
        test_id INTEGER REFERENCES public.tests(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
        order_num INTEGER NOT NULL,
        PRIMARY KEY (test_id, question_id)
    );

    -- 3. Enable RLS
    ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

    -- 4. Public policies for viewing tests
    DROP POLICY IF EXISTS "Public Read Access" ON public.tests;
    CREATE POLICY "Public Read Access" ON public.tests FOR SELECT USING (status = 'PUBLISHED');

    DROP POLICY IF EXISTS "Public Read Access" ON public.test_questions;
    CREATE POLICY "Public Read Access" ON public.test_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.tests WHERE id = test_id AND status = 'PUBLISHED')
    );
  `;

  try {
    await client.query(sql);
    console.log("Test tables migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
