const { Client } = require('pg');

const uri = "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres";

const client = new Client({
  connectionString: uri,
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const sql = `
    -- 1. Create Categories (Engineering, Medical, Govt)
    CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Add category to exams safely
    ALTER TABLE public.exams 
    ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL;

    -- 2. Hierarchical Topics
    ALTER TABLE public.topics
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES public.topics(id) ON DELETE CASCADE;

    -- 3. Enhance Questions Table for Scale
    ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'Unclassified' CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Unclassified')),
    ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'MSQ', 'NAT', 'OTHER')),
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'English';

    -- Create index for deduplication lookups
    CREATE INDEX IF NOT EXISTS idx_questions_content_hash ON public.questions(content_hash);

    -- 4. Question Topics Mapping (Many-to-Many)
    CREATE TABLE IF NOT EXISTS public.question_topics (
        question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES public.topics(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        PRIMARY KEY (question_id, topic_id)
    );

    -- Migrate existing 1:1 topic_ids to the new junction table safely
    INSERT INTO public.question_topics (question_id, topic_id, is_primary)
    SELECT id, topic_id, true FROM public.questions WHERE topic_id IS NOT NULL
    ON CONFLICT (question_id, topic_id) DO NOTHING;

    -- 5. Source Papers
    CREATE TABLE IF NOT EXISTS public.source_papers (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES public.exams(id) ON DELETE CASCADE,
        year INTEGER,
        session VARCHAR(50),
        paper_title VARCHAR(200) NOT NULL,
        question_paper_file_path TEXT,
        answer_key_file_path TEXT,
        total_questions INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'IMPORTED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 6. Paper Questions Mapping
    CREATE TABLE IF NOT EXISTS public.paper_questions (
        id SERIAL PRIMARY KEY,
        source_paper_id INTEGER REFERENCES public.source_papers(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES public.questions(id) ON DELETE CASCADE,
        question_number VARCHAR(20),
        marks NUMERIC(5,2),
        negative_marks NUMERIC(5,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(source_paper_id, question_id)
    );

    -- 7. Import Jobs Tracking
    CREATE TABLE IF NOT EXISTS public.import_jobs (
        id SERIAL PRIMARY KEY,
        source_paper_id INTEGER REFERENCES public.source_papers(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
        total_pages INTEGER DEFAULT 0,
        total_questions_detected INTEGER DEFAULT 0,
        total_questions_processed INTEGER DEFAULT 0,
        total_questions_failed INTEGER DEFAULT 0,
        error_details TEXT,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Enable RLS on new tables (Admins only for now via anon block or direct pg connection)
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.source_papers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.paper_questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;

    -- Add default categories if empty
    INSERT INTO public.categories (name, description)
    VALUES 
    ('Engineering Entrance', 'GATE, JEE Main, JEE Advanced, BITSAT'),
    ('Medical Entrance', 'NEET, AIIMS'),
    ('Government Exams', 'SSC CGL, SSC CHSL, UPSC')
    ON CONFLICT (name) DO NOTHING;
  `;

  try {
    await client.query(sql);
    console.log("Scale architecture migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
