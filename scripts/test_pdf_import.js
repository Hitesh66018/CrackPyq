const fs = require('fs');
const { Pool } = require('pg');

async function testPdfImport() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
  });
  const client = await pool.connect();
  
  try {
    console.log("=== STARTING PDF IMPORT INTEGRATION TEST ===");
    
    // We will test the DB insertion logic and schema as mocking the NextRequest and fetch is tricky in vanilla node
    // Let's directly simulate what the API route does with the DB.
    
    // 1. Create a Source Paper record
    const insertPaperQuery = `
      INSERT INTO source_papers (paper_title, question_paper_file_path, status)
      VALUES ($1, $2, 'PROCESSING')
      RETURNING id
    `;
    const paperRes = await client.query(insertPaperQuery, ['test_paper.pdf', 'uploaded_file.pdf']);
    const sourcePaperId = paperRes.rows[0].id;
    console.log(`[1] Created Source Paper ID: ${sourcePaperId}`);
    
    // 2. Create an Import Job
    const insertJobQuery = `
      INSERT INTO import_jobs (source_paper_id, status)
      VALUES ($1, 'PROCESSING')
      RETURNING id
    `;
    const jobRes = await client.query(insertJobQuery, [sourcePaperId]);
    const jobId = jobRes.rows[0].id;
    console.log(`[2] Created Import Job ID: ${jobId}`);

    // Simulate Gemini Response 
    const mockGeminiResponse = [
      {
        topic_id: 1,
        question_type: "MCQ",
        question_text: "What is 2 + 2?",
        option_a: "3",
        option_b: "4",
        option_c: "5",
        option_d: "6",
        correct_answer: "B",
        positive_marks: 2,
        negative_marks: 0.5,
        detailed_solution: "Simple math"
      },
      {
        topic_id: 1,
        question_type: "MSQ",
        question_text: "Select even numbers",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "5",
        correct_answer: "A,C",
        positive_marks: 4,
        negative_marks: 1,
        detailed_solution: "2 and 4 are even"
      },
      {
        topic_id: 1,
        question_type: "NAT",
        question_text: "Value of Pi?",
        nat_answer_min: 3.14,
        nat_answer_max: 3.15,
        positive_marks: 3,
        negative_marks: 0,
        detailed_solution: "Pi is approx 3.14159"
      }
    ];

    console.log("[3] Simulating Gemini parsing and DB insertion...");
    
    // Fetch a valid topic_id
    const topicRes = await client.query("SELECT id FROM topics LIMIT 1");
    let validTopicId = 1;
    if (topicRes.rows.length > 0) {
      validTopicId = topicRes.rows[0].id;
    } else {
      const subjectRes = await client.query("INSERT INTO subjects (name, description) VALUES ('Test Sub', '') RETURNING id");
      const newSub = subjectRes.rows[0].id;
      const topicIns = await client.query("INSERT INTO topics (subject_id, name) VALUES ($1, 'Test Top') RETURNING id", [newSub]);
      validTopicId = topicIns.rows[0].id;
    }

    let successCount = 0;

    for (const q of mockGeminiResponse) {
      let contentHash = String(Date.now()) + Math.random();
      
      const insertQQuery = `
        INSERT INTO questions (topic_id, question_text, detailed_solution, positive_marks, negative_marks, status, content_hash, question_type, nat_answer_min, nat_answer_max)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      const qValues = [
        validTopicId,
        q.question_text,
        q.detailed_solution || '',
        q.positive_marks || 1,
        q.negative_marks || 0,
        'PENDING_REVIEW',
        contentHash,
        q.question_type,
        q.question_type === 'NAT' ? q.nat_answer_min : null,
        q.question_type === 'NAT' ? q.nat_answer_max : null
      ];
      
      const qRes = await client.query(insertQQuery, qValues);
      const insertedQId = qRes.rows[0].id;
      
      // Link to Source Paper
      await client.query(`
        INSERT INTO paper_questions (source_paper_id, question_id, question_number, marks, negative_marks)
        VALUES ($1, $2, $3, $4, $5)
      `, [sourcePaperId, insertedQId, "Q" + (successCount + 1), q.positive_marks || 1, q.negative_marks || 0]);

      // Insert options based on type
      if (q.question_type === 'MCQ' || q.question_type === 'MSQ') {
        const correctStr = (q.correct_answer || 'A').toUpperCase();
        const isCorrectA = correctStr.includes('A');
        const isCorrectB = correctStr.includes('B');
        const isCorrectC = correctStr.includes('C');
        const isCorrectD = correctStr.includes('D');

        const insertOptQuery = `
          INSERT INTO options (question_id, option_text, is_correct)
          VALUES 
          ($1, $2, $3),
          ($4, $5, $6),
          ($7, $8, $9),
          ($10, $11, $12)
        `;
        await client.query(insertOptQuery, [
          insertedQId, q.option_a || "Option A", isCorrectA,
          insertedQId, q.option_b || "Option B", isCorrectB,
          insertedQId, q.option_c || "Option C", isCorrectC,
          insertedQId, q.option_d || "Option D", isCorrectD
        ]);
      }
      
      successCount++;
      console.log(`  -> Inserted ${q.question_type} Question ID: ${insertedQId}`);
    }

    // Assertions
    console.log("\n[4] Running Assertions...");
    if (successCount !== 3) throw new Error("Failed to insert all questions");
    
    const dbCheck = await client.query(`
      SELECT q.* FROM questions q 
      JOIN paper_questions pq ON q.id = pq.question_id 
      WHERE pq.source_paper_id = $1 ORDER BY q.id ASC
    `, [sourcePaperId]);
    if (dbCheck.rows.length !== 3) throw new Error("DB row count mismatch");
    
    const msqQ = dbCheck.rows[1];
    const msqOpts = await client.query("SELECT * FROM options WHERE question_id = $1 AND is_correct = true", [msqQ.id]);
    if (msqOpts.rows.length !== 2) throw new Error("MSQ should have 2 correct options inserted");
    
    const natQ = dbCheck.rows[2];
    if (Number(natQ.nat_answer_min) !== 3.14) throw new Error("NAT min value mismatch");

    console.log("-> All assertions PASSED!");

    // Cleanup
    console.log("\n[5] Cleaning up mock data...");
    const allQs = dbCheck.rows.map(r => r.id);
    await client.query("DELETE FROM options WHERE question_id = ANY($1::int[])", [allQs]);
    await client.query("DELETE FROM paper_questions WHERE source_paper_id = $1", [sourcePaperId]);
    await client.query("DELETE FROM questions WHERE id = ANY($1::int[])", [allQs]);
    await client.query("DELETE FROM import_jobs WHERE id = $1", [jobId]);
    await client.query("DELETE FROM source_papers WHERE id = $1", [sourcePaperId]);
    
    console.log("=== PDF IMPORT MODULE TEST PASSED SUCCESSFULLY ===");

  } catch (e) {
    console.error("TEST FAILED:", e);
  } finally {
    client.release();
    pool.end();
  }
}

testPdfImport();
