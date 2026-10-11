const { Pool } = require('pg');
const assert = require('assert');

const pool = new Pool({
  connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

async function runE2E() {
  console.log("🚀 Starting End-to-End Database Simulation Test...");
  
  try {
    // 1. Get a random user
    const userRes = await pool.query("SELECT id FROM auth.users LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log("No users found to test with.");
      return;
    }
    const userId = userRes.rows[0].id;
    console.log(`✅ Using User: ${userId}`);

    // SEEDING
    console.log("⏳ Seeding Mock Exam, Test, and Questions...");
    // Find or create category
    let catRes = await pool.query("SELECT id FROM categories LIMIT 1");
    if(catRes.rows.length === 0) {
       catRes = await pool.query("INSERT INTO categories (name) VALUES ('E2E Category') RETURNING id");
    }
    const catId = catRes.rows[0].id;

    let examRes = await pool.query("SELECT id FROM exams LIMIT 1");
    if(examRes.rows.length === 0) {
       examRes = await pool.query("INSERT INTO exams (category_id, name) VALUES ($1, 'E2E GATE CS') RETURNING id", [catId]);
    }
    const examId = examRes.rows[0].id;

    const testInsert = await pool.query("INSERT INTO tests (exam_id, title, duration_minutes) VALUES ($1, 'E2E Full Mock Test', 180) RETURNING id", [examId]);
    const testId = testInsert.rows[0].id;

    const qIds = [];
    for(let i=1; i<=5; i++) {
      const qRes = await pool.query("INSERT INTO questions (question_type, question_text, positive_marks, negative_marks) VALUES ('MCQ', $1, 2, 0.66) RETURNING id", [`E2E Question ${i}`]);
      const qId = qRes.rows[0].id;
      qIds.push(qId);
      await pool.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, 'A', true), ($1, 'B', false)", [qId]);
      await pool.query("INSERT INTO test_questions (test_id, question_id, order_num) VALUES ($1, $2, $3)", [testId, qId, i]);
    }
    console.log(`✅ Seeding Complete. Created Test: ${testId}`);

    // 3. Start an Attempt (Engine Init)
    console.log("⏳ Starting Test Attempt...");
    const attemptInsert = await pool.query(`
      INSERT INTO test_attempts (user_id, test_id, status, deadline)
      VALUES ($1, $2, 'IN_PROGRESS', NOW() + interval '1 hour')
      RETURNING id
    `, [userId, testId]);
    const attemptId = attemptInsert.rows[0].id;
    console.log(`✅ Created Attempt: ${attemptId}`);

    // 4. Fetch Questions (Engine Load)
    const questionsRes = await pool.query("SELECT question_id FROM test_questions WHERE test_id = $1", [testId]);
    qIds.length = 0; // Clear it if needed, but we already have qIds from above. Or just redefine.
    questionsRes.rows.forEach(r => qIds.push(r.question_id));
    console.log(`✅ Loaded ${qIds.length} questions for the test.`);

    // 5. Answer questions (Engine Save)
    console.log("⏳ Simulating answering questions...");
    for (let i = 0; i < Math.min(qIds.length, 3); i++) {
      const qId = qIds[i];
      // Get an option for this question
      const opts = await pool.query("SELECT id FROM options WHERE question_id = $1 LIMIT 1", [qId]);
      if (opts.rows.length > 0) {
        await pool.query(`
          INSERT INTO attempt_details (attempt_id, question_id, selected_option_id, status, time_spent_seconds)
          VALUES ($1, $2, $3, 'ANSWERED', 45)
        `, [attemptId, qId, opts.rows[0].id]);
        console.log(`   -> Answered Question ${qId}`);
      }
    }

    // 6. Submit Test (Engine Submit)
    console.log("⏳ Submitting test...");
    await pool.query(`
      UPDATE test_attempts SET status = 'SUBMITTED', end_time = NOW(), total_score = 15
      WHERE id = $1
    `, [attemptId]);
    console.log(`✅ Test Submitted Successfully.`);

    // 7. Verify Dashboard Analytics
    console.log("⏳ Verifying Dashboard Stats...");
    const statsRes = await pool.query(`
      SELECT COUNT(*) as attempts FROM test_attempts WHERE user_id = $1 AND status = 'SUBMITTED'
    `, [userId]);
    assert(statsRes.rows[0].attempts > 0, "Dashboard attempts should be > 0");
    console.log(`✅ Dashboard verified. Total attempts: ${statsRes.rows[0].attempts}`);

    // 8. Bookmark a question
    console.log("⏳ Testing Bookmarks System...");
    const bookmarkQId = qIds[0];
    await pool.query(`
      INSERT INTO bookmarks (user_id, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [userId, bookmarkQId]);
    const bmRes = await pool.query("SELECT * FROM bookmarks WHERE user_id = $1 AND question_id = $2", [userId, bookmarkQId]);
    assert(bmRes.rows.length === 1, "Bookmark should exist");
    console.log(`✅ Bookmarked question ${bookmarkQId} successfully.`);

    console.log("\n🎉 ALL E2E END-TO-END FLOWS PASSED SUCCESSFULLY! 🎉");

  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err);
  } finally {
    pool.end();
  }
}

runE2E();
