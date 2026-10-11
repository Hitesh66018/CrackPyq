import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/import-pdf/route';
import { NextRequest } from 'next/server';
import { Pool } from 'pg';

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify([{
                topic_id: 1,
                question_type: "MCQ",
                question_text: "Test MCQ Question",
                option_a: "A",
                option_b: "B",
                option_c: "C",
                option_d: "D",
                correct_answer: "A",
                positive_marks: 2,
                negative_marks: 0.5,
                detailed_solution: "Mock solution"
              }])
            }
          })
        }
      };
    })
  };
});

describe('POST /api/import-pdf', () => {
  let pool: Pool;

  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    pool = new Pool({
      connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should process a PDF and insert mocked questions into the DB', async () => {
    // Create a mock FormData with a tiny PDF file
    const formData = new FormData();
    const pdfBlob = new Blob(['%PDF-1.4 mock pdf data'], { type: 'application/pdf' });
    formData.append('paperFile', pdfBlob as any, 'test_paper.pdf');
    formData.append('topic_id', '1');

    const req = new NextRequest('http://localhost:3000/api/import-pdf', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.imported).toBe(1);

    // Verify it was inserted in DB
    const client = await pool.connect();
    try {
      // Find the source paper created
      const paperRes = await client.query("SELECT id FROM source_papers WHERE paper_title = 'test_paper.pdf' ORDER BY id DESC LIMIT 1");
      expect(paperRes.rows.length).toBe(1);
      const paperId = paperRes.rows[0].id;

      // Find jobs
      const jobRes = await client.query("SELECT id FROM import_jobs WHERE source_paper_id = $1", [paperId]);
      expect(jobRes.rows.length).toBe(1);
      const jobId = jobRes.rows[0].id;

      // Find questions with this job_id
      const qRes = await client.query("SELECT * FROM questions WHERE import_job_id = $1", [jobId]);
      expect(qRes.rows.length).toBe(1);
      const question = qRes.rows[0];
      
      expect(question.question_text).toBe("Test MCQ Question");
      expect(question.question_type).toBe("MCQ");

      // Cleanup
      await client.query("DELETE FROM options WHERE question_id = $1", [question.id]);
      await client.query("DELETE FROM questions WHERE import_job_id = $1", [jobId]);
      await client.query("DELETE FROM import_jobs WHERE id = $1", [jobId]);
      await client.query("DELETE FROM source_papers WHERE id = $1", [paperId]);

    } finally {
      client.release();
    }
  });

  it('should return 400 if no PDF is provided', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/import-pdf', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('No Question Paper PDF provided.');
  });
});
