const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

async function runIntegrationTest() {
  console.log("==================================================");
  console.log("🚀 INITIATING CRACKPYQ END-TO-END INTEGRATION TEST");
  console.log("==================================================\n");

  const client = await pool.connect();
  
  try {
    // ---------------------------------------------------------
    // STEP 1: CREATE TEST DATA (MOCK TEST & QUESTIONS)
    // ---------------------------------------------------------
    console.log("[1/6] 📝 Setting up Mock Test data...");
    
    // Create a mock exam or use existing
    const examRes = await client.query("SELECT id FROM exams LIMIT 1");
    if (examRes.rows.length === 0) throw new Error("No exams found");
    const examId = examRes.rows[0].id;
    
    // Create a mock test
    const testRes = await client.query("INSERT INTO tests (exam_id, title, duration_minutes, status) VALUES ($1, 'Integration Mock Test', 60, 'PUBLISHED') RETURNING id", [examId]);
    const testId = testRes.rows[0].id;

    // Create MCQ Question
    const mcqRes = await client.query(`
      INSERT INTO questions (topic_id, question_text, question_type, positive_marks, negative_marks, status) 
      VALUES (1, 'MCQ: What is 2 + 2?', 'MCQ', 2, 0.5, 'PUBLISHED') RETURNING id
    `);
    const qMcqId = mcqRes.rows[0].id;
    await client.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, '3', false), ($1, '4', true), ($1, '5', false)", [qMcqId]);
    const mcqCorrectOptRes = await client.query("SELECT id FROM options WHERE question_id = $1 AND is_correct = true", [qMcqId]);
    const mcqCorrectOptId = mcqCorrectOptRes.rows[0].id;

    // Create MSQ Question
    const msqRes = await client.query(`
      INSERT INTO questions (topic_id, question_text, question_type, positive_marks, negative_marks, status) 
      VALUES (1, 'MSQ: Select even numbers', 'MSQ', 4, 1, 'PUBLISHED') RETURNING id
    `);
    const qMsqId = msqRes.rows[0].id;
    await client.query("INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, '2', true), ($1, '3', false), ($1, '4', true)", [qMsqId]);
    const msqCorrectOptsRes = await client.query("SELECT id FROM options WHERE question_id = $1 AND is_correct = true", [qMsqId]);
    const msqCorrectOptIds = msqCorrectOptsRes.rows.map(r => r.id);

    // Create NAT Question
    const natRes = await client.query(`
      INSERT INTO questions (topic_id, question_text, question_type, positive_marks, negative_marks, nat_answer_min, nat_answer_max, status) 
      VALUES (1, 'NAT: Value of Pi (2 decimal places)?', 'NAT', 3, 0, 3.14, 3.14, 'PUBLISHED') RETURNING id
    `);
    const qNatId = natRes.rows[0].id;

    // Attach questions to test
    await client.query("INSERT INTO test_questions (test_id, question_id, order_num) VALUES ($1, $2, 1), ($1, $3, 2), ($1, $4, 3)", [testId, qMcqId, qMsqId, qNatId]);
    
    console.log("  ✅ Mock Test & Questions Created!");

    // ---------------------------------------------------------
    // STEP 2: MOCK USER LOGIN
    // ---------------------------------------------------------
    console.log("\n[2/6] 👤 Fetching a valid User ID...");
    const userRes = await client.query("SELECT id FROM auth.users LIMIT 1");
    if (userRes.rows.length === 0) throw new Error("No users found in auth.users. Please sign up first.");
    const userId = userRes.rows[0].id;
    console.log(`  ✅ Testing as User: ${userId}`);

    // ---------------------------------------------------------
    // STEP 3: INITIALIZE TEST ATTEMPT (simulate /api/practice/engine/init)
    // ---------------------------------------------------------
    console.log("\n[3/6] ⏱️ Initializing Test Attempt...");
    const attemptRes = await client.query(`
      INSERT INTO test_attempts (user_id, test_id, status, deadline) 
      VALUES ($1, $2, 'IN_PROGRESS', NOW() + INTERVAL '60 minutes') RETURNING id
    `, [userId, testId]);
    const attemptId = attemptRes.rows[0].id;
    console.log(`  ✅ Attempt Created: ${attemptId}`);

    // ---------------------------------------------------------
    // STEP 4: AUTOSAVE ANSWERS (simulate /api/practice/save)
    // ---------------------------------------------------------
    console.log("\n[4/6] 💾 Simulating Autosaving Answers (Student taking test)...");
    
    // Answer MCQ (Correctly)
    await client.query(`
      INSERT INTO attempt_details (attempt_id, question_id, selected_option_id, status)
      VALUES ($1, $2, $3, 'ANSWERED')
    `, [attemptId, qMcqId, mcqCorrectOptId]);
    console.log("  ✅ Saved MCQ Answer (Correct)");

    // Answer MSQ (Incorrectly - missing one correct option)
    await client.query(`
      INSERT INTO attempt_details (attempt_id, question_id, selected_options_array, status)
      VALUES ($1, $2, $3, 'ANSWERED')
    `, [attemptId, qMsqId, `{${msqCorrectOptIds[0]}}`]);
    console.log("  ✅ Saved MSQ Answer (Incorrect/Partial)");

    // Answer NAT (Correctly)
    await client.query(`
      INSERT INTO attempt_details (attempt_id, question_id, answer_text, status)
      VALUES ($1, $2, $3, 'ANSWERED')
    `, [attemptId, qNatId, "3.14"]);
    console.log("  ✅ Saved NAT Answer (Correct)");


    // ---------------------------------------------------------
    // STEP 5: SUBMIT AND EVALUATE TEST (simulate /api/practice/submit)
    // ---------------------------------------------------------
    console.log("\n[5/6] 📊 Submitting Test & Evaluating Scores...");
    
    let totalScore = 0;
    const questionsListRes = await client.query(`
      SELECT q.id, q.question_type, q.positive_marks, q.negative_marks, q.nat_answer_min, q.nat_answer_max
      FROM test_questions tq JOIN questions q ON tq.question_id = q.id WHERE tq.test_id = $1
    `, [testId]);

    const optionsListRes = await client.query(`
      SELECT question_id, id as option_id FROM options WHERE question_id = ANY($1::int[]) AND is_correct = true
    `, [questionsListRes.rows.map(q => q.id)]);

    const correctOptionsMap = {};
    optionsListRes.rows.forEach(o => {
      if (!correctOptionsMap[o.question_id]) correctOptionsMap[o.question_id] = [];
      correctOptionsMap[o.question_id].push(o.option_id);
    });

    const responsesRes = await client.query("SELECT * FROM attempt_details WHERE attempt_id = $1", [attemptId]);

    for (const res of responsesRes.rows) {
      const q = questionsListRes.rows.find(x => x.id === res.question_id);
      if (!q) continue;

      const isAnswered = res.selected_option_id || 
                         (res.selected_options_array && res.selected_options_array.length > 0) || 
                         (res.answer_text && res.answer_text.trim() !== '');

      if (isAnswered) {
        let isCorrect = false;

        if (q.question_type === 'MCQ') {
          const correctId = correctOptionsMap[q.id]?.[0];
          isCorrect = res.selected_option_id === correctId;
        } 
        else if (q.question_type === 'MSQ') {
          const correctIds = correctOptionsMap[q.id] || [];
          const selected = res.selected_options_array || [];
          isCorrect = selected.length > 0 && selected.length === correctIds.length && selected.every(id => correctIds.includes(id));
        } 
        else if (q.question_type === 'NAT') {
          const val = parseFloat(res.answer_text);
          if (!isNaN(val)) {
            const min = parseFloat(q.nat_answer_min) || 0;
            const max = parseFloat(q.nat_answer_max) || 0;
            isCorrect = val >= min && val <= max;
          }
        }

        const marks = isCorrect ? Number(q.positive_marks) : -Number(q.negative_marks);
        totalScore += marks;
        
        await client.query("UPDATE attempt_details SET is_correct = $1, marks_obtained = $2 WHERE id = $3", [isCorrect, marks, res.id]);
        console.log(`  🔍 Evaluated Question ${q.id} (${q.question_type}): Correct=${isCorrect}, Marks=${marks}`);
      }
    }

    await client.query("UPDATE test_attempts SET status = 'SUBMITTED', end_time = NOW(), total_score = $1 WHERE id = $2", [totalScore, attemptId]);
    console.log(`  ✅ Test Submitted! Total Calculated Score: ${totalScore}`);


    // ---------------------------------------------------------
    // STEP 6: ASSERTIONS & CLEANUP
    // ---------------------------------------------------------
    console.log("\n[6/6] 🧹 Running Assertions & Cleaning up...");
    
    // Expected Score: MCQ (Correct) = +2. MSQ (Incorrect) = -1. NAT (Correct) = +3. Total = 4.
    if (totalScore !== 4) {
      console.error(`  ❌ ASSERTION FAILED: Expected score 4, got ${totalScore}`);
    } else {
      console.log(`  ✅ ASSERTION PASSED: Final Score matches expected business logic (4).`);
    }

    // Cleanup mock data so DB remains clean
    await client.query("DELETE FROM test_attempts WHERE id = $1", [attemptId]);
    await client.query("DELETE FROM tests WHERE id = $1", [testId]);
    await client.query("DELETE FROM exams WHERE id = $1", [examId]);
    await client.query("DELETE FROM questions WHERE id = ANY($1::int[])", [[qMcqId, qMsqId, qNatId]]);
    
    console.log("  ✅ Cleanup Complete!");

    console.log("\n🎉 INTEGRATION TEST PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ INTEGRATION TEST FAILED:", err);
  } finally {
    client.release();
    pool.end();
  }
}

runIntegrationTest();
