-- Phase 2: Universal Exam Taxonomy Migration
-- Non-destructive extension of existing CrackPYQ schema

-- 1. Enhance categories to act as exam_families
ALTER TABLE categories ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- 2. Enhance exams table with slug, code, and readiness status
ALTER TABLE exams ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PLANNED';
-- Permitted statuses: 'PLANNED', 'CONFIGURING', 'READY_FOR_IMPORT', 'CONTENT_AVAILABLE'
ALTER TABLE exams ADD COLUMN IF NOT EXISTS total_papers INT DEFAULT 0;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS syllabus_version VARCHAR(50) DEFAULT '2025-2026';

-- 3. Create exam_papers table (for year/session/shift tracking)
CREATE TABLE IF NOT EXISTS exam_papers (
  id SERIAL PRIMARY KEY,
  exam_id INT REFERENCES exams(id) ON DELETE CASCADE,
  year INT NOT NULL,
  session_name VARCHAR(100) DEFAULT 'Shift 1',
  code VARCHAR(100) UNIQUE,
  total_marks NUMERIC(5,2) DEFAULT 100,
  duration_minutes INT DEFAULT 180,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_papers_exam_year ON exam_papers(exam_id, year);

-- 4. Enhance subjects table
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_subjects_exam_id ON subjects(exam_id);

-- 5. Enhance topics table with parent_topic_id (hierarchical topics/subtopics)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS code VARCHAR(100) UNIQUE;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS parent_topic_id INT REFERENCES topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON topics(parent_topic_id);

-- 6. Create question_topics table for many-to-many relationship
CREATE TABLE IF NOT EXISTS question_topics (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_question_topics_question ON question_topics(question_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON question_topics(topic_id);

-- 7. Enhance source_papers and import_jobs with exact taxonomy provenance
ALTER TABLE source_papers ADD COLUMN IF NOT EXISTS exam_paper_id INT REFERENCES exam_papers(id) ON DELETE SET NULL;
ALTER TABLE source_papers ADD COLUMN IF NOT EXISTS syllabus_version VARCHAR(50);
ALTER TABLE source_papers ADD COLUMN IF NOT EXISTS extracted_count INT DEFAULT 0;

ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS exam_id INT REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS exam_paper_id INT REFERENCES exam_papers(id) ON DELETE SET NULL;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS range_start INT;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS range_end INT;
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS log_details JSONB DEFAULT '[]'::jsonb;
