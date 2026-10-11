const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    -- Create Test Attempts Table
    CREATE TABLE IF NOT EXISTS public.test_attempts (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow null for anonymous tests during prototype
        test_id INTEGER REFERENCES public.tests(id) ON DELETE CASCADE,
        score DECIMAL(10,2) DEFAULT 0,
        time_taken_seconds INTEGER,
        status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Create Attempt Details Table
    CREATE TABLE IF NOT EXISTS public.attempt_details (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES public.test_attempts(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
        selected_option_id INTEGER REFERENCES public.options(id) ON DELETE SET NULL,
        is_correct BOOLEAN,
        marks_awarded DECIMAL(5,2) DEFAULT 0
    );

    -- Enable RLS
    ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.attempt_details ENABLE ROW LEVEL SECURITY;

    -- Disable RLS constraints for simplicity during prototype phase for these tables
    DROP POLICY IF EXISTS "Enable all access for prototype" ON public.test_attempts;
    CREATE POLICY "Enable all access for prototype" ON public.test_attempts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all access for prototype" ON public.attempt_details;
    CREATE POLICY "Enable all access for prototype" ON public.attempt_details FOR ALL USING (true) WITH CHECK (true);
  `;

  try {
    await client.query(sql);
    console.log("Analytics tables migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
