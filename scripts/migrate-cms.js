const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    CREATE TABLE IF NOT EXISTS public.site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Insert default homepage settings
    INSERT INTO public.site_settings (key, value)
    VALUES (
      'homepage', 
      '{"hero_title": "Master Your Exams", "hero_subtitle": "The ultimate PYQ platform for GATE, JEE, and NEET.", "announcement": "New GATE 2024 papers added!"}'
    ) ON CONFLICT (key) DO NOTHING;

    -- Enable RLS
    ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

    -- Admins can update, public can read
    DROP POLICY IF EXISTS "Public Read Access" ON public.site_settings;
    CREATE POLICY "Public Read Access" ON public.site_settings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Admin All Access" ON public.site_settings;
    CREATE POLICY "Admin All Access" ON public.site_settings FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'CONTENT_ADMIN')
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'CONTENT_ADMIN')
      )
    );
  `;

  try {
    await client.query(sql);
    console.log("Site settings migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
