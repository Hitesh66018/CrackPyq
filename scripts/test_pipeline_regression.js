const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runRegressionTests() {
  console.log('=== RUNNING REGRESSION TESTS FOR GATE CSE IMPORT PIPELINE ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Verify GATE CSE Exam exists with ID 4 and has 11 official subjects
  try {
    const examRes = await pool.query("SELECT id, name, code FROM exams WHERE id = 4");
    if (examRes.rows.length === 1 && examRes.rows[0].code === 'GATE_CS') {
      console.log('✅ Test 1 Passed: GATE CSE (ID 4) verified in database.');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: GATE CSE not found or code incorrect.');
      failed++;
    }

    const subRes = await pool.query("SELECT COUNT(*) as cnt FROM subjects WHERE exam_id = 4");
    if (parseInt(subRes.rows[0].cnt) === 11) {
      console.log('✅ Test 1b Passed: GATE CSE has all 11 official subjects.');
      passed++;
    } else {
      console.error('❌ Test 1b Failed: Subject count is ' + subRes.rows[0].cnt);
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 1 Error:', err.message);
    failed++;
  }

  // Test 2: Verify GATE CSE has Unresolved Topic
  try {
    const unres = await pool.query("SELECT id, name, code FROM topics WHERE code = 'GATE_CS_UNRESOLVED'");
    if (unres.rows.length === 1) {
      console.log('✅ Test 2 Passed: Designated GATE CSE Unresolved topic verified (ID: ' + unres.rows[0].id + ').');
      passed++;
    } else {
      console.error('❌ Test 2 Failed: GATE_CS_UNRESOLVED topic not found.');
      failed++;
    }
  } catch (err) {
    console.error('❌ Test 2 Error:', err.message);
    failed++;
  }

  // Test 3: Insert a mock draft question with GATE CSE metadata and ORS Code A
  let testQId = null;
  try {
    const topicRes = await pool.query("SELECT t.id FROM topics t JOIN subjects s ON t.subject_id = s.id WHERE s.exam_id = 4 AND t.code != 'GATE_CS_UNRESOLVED' LIMIT 1");
    const testTopicId = topicRes.rows[0].id;

    // Insert source paper
    const spRes = await pool.query(`
      INSERT INTO source_papers (paper_title, exam_id, year, ors_code, status)
      VALUES ('GATE 2013 Computer Science (Test)', 4, 2013, 'A', 'IMPORTED')
      RETURNING id
    `);
    const spId = spRes.rows[0].id;

    // Insert question 1: Normal MCQ Q1
    const q1Res = await pool.query(`
      INSERT INTO questions (topic_id, exam_year, ors_code, is_marks_to_all, is_unresolved, question_text, positive_marks, negative_marks, status, question_type)
      VALUES ($1, 2013, 'A', FALSE, FALSE, 'Binary operation test question', 1, 0.33, 'PENDING_REVIEW', 'MCQ')
      RETURNING id
    `, [testTopicId]);
    testQId = q1Res.rows[0].id;

    await pool.query(`
      INSERT INTO question_topics (question_id, topic_id, is_primary)
      VALUES ($1, $2, TRUE)
    `, [testQId, testTopicId]);

    await pool.query(`
      INSERT INTO paper_questions (source_paper_id, question_id, question_number, marks, negative_marks)
      VALUES ($1, $2, 'Q1', 1, 0.33)
    `, [spId, testQId]);

    // Insert question 2: "Marks to All" Q42
    const q42Res = await pool.query(`
      INSERT INTO questions (topic_id, exam_year, ors_code, is_marks_to_all, is_unresolved, question_text, positive_marks, negative_marks, status, question_type, reviewer_notes)
      VALUES ($1, 2013, 'A', TRUE, FALSE, 'Function f(p,p) test question', 2, 0, 'PENDING_REVIEW', 'MCQ', 'Official Answer Key: Marks to All')
      RETURNING id
    `, [testTopicId]);
    const q42Id = q42Res.rows[0].id;

    await pool.query(`
      INSERT INTO paper_questions (source_paper_id, question_id, question_number, marks, negative_marks)
      VALUES ($1, $2, 'Q42', 2, 0)
    `, [spId, q42Id]);

    console.log('✅ Test 3 Passed: Mock GATE 2013 questions inserted (Q1 & Q42 with Marks to All).');
    passed++;

    // Test 4: Query Review Queue for this question and verify breadcrumbs
    const reviewQuery = await pool.query(`
      SELECT 
        q.id, q.exam_year, q.ors_code, q.is_marks_to_all, q.is_unresolved,
        t.name as topic_name, s.name as subject_name, e.name as exam_name,
        pq.question_number
      FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN exams e ON s.exam_id = e.id
      LEFT JOIN paper_questions pq ON q.id = pq.question_id
      WHERE q.id IN ($1, $2)
    `, [testQId, q42Id]);

    const row1 = reviewQuery.rows.find(r => r.id === testQId);
    const row42 = reviewQuery.rows.find(r => r.id === q42Id);

    if (row1 && row1.exam_name === 'GATE Computer Science & IT' && row1.exam_year === 2013 && row1.ors_code === 'A') {
      console.log('✅ Test 4 Passed: Review Queue resolves GATE CSE -> 2013 -> Computer Science and IT without JEE default.');
      passed++;
    } else {
      console.error('❌ Test 4 Failed: Incorrect breadcrumb metadata for Q1:', row1);
      failed++;
    }

    if (row42 && row42.is_marks_to_all === true) {
      console.log('✅ Test 5 Passed: Question Q42 preserved "Marks to All" outcome accurately.');
      passed++;
    } else {
      console.error('❌ Test 5 Failed: Marks to All not preserved:', row42);
      failed++;
    }

    // Test 6: Approve Question and verify Question Bank transition
    await pool.query("UPDATE questions SET status = 'PUBLISHED' WHERE id = $1", [testQId]);
    const qbRes = await pool.query(`
      SELECT q.id, q.status, e.id as exam_id
      FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN exams e ON s.exam_id = e.id
      WHERE q.status = 'PUBLISHED' AND s.exam_id = 4 AND q.id = $1
    `, [testQId]);

    if (qbRes.rows.length === 1 && qbRes.rows[0].status === 'PUBLISHED') {
      console.log('✅ Test 6 Passed: Approved question immediately appears under GATE CSE in Question Bank.');
      passed++;
    } else {
      console.error('❌ Test 6 Failed: Question not found in Question Bank under exam 4.');
      failed++;
    }

    // Clean up test records
    await pool.query("DELETE FROM paper_questions WHERE source_paper_id = $1", [spId]);
    await pool.query("DELETE FROM question_topics WHERE question_id IN ($1, $2)", [testQId, q42Id]);
    await pool.query("DELETE FROM questions WHERE id IN ($1, $2)", [testQId, q42Id]);
    await pool.query("DELETE FROM source_papers WHERE id = $1", [spId]);
    console.log('🧹 Cleaned up temporary test records.');

  } catch (err) {
    console.error('❌ Regression Test Pipeline Error:', err);
    failed++;
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runRegressionTests();
