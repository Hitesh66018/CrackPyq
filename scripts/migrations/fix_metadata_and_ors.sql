-- Non-destructive enhancements for metadata propagation, ORS code, and Marks to All handling

ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_marks_to_all BOOLEAN DEFAULT FALSE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS ors_code VARCHAR(10);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_unresolved BOOLEAN DEFAULT FALSE;

ALTER TABLE source_papers ADD COLUMN IF NOT EXISTS ors_code VARCHAR(10);
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS ors_code VARCHAR(10);

-- Insert or ensure an Unresolved / Needs Review topic for GATE CSE (exam_id = 4, subject_id = 15: General Aptitude)
INSERT INTO topics (subject_id, name, code, display_order)
SELECT 15, 'General / Uncategorized (Needs Review)', 'GATE_CS_UNRESOLVED', 99
WHERE NOT EXISTS (
  SELECT 1 FROM topics WHERE code = 'GATE_CS_UNRESOLVED'
);
