import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/utils/db";
import crypto from "crypto";

export const maxDuration = 60; // Next.js serverless function max duration

// Helper to clean and parse JSON from AI response
function extractJsonArray(rawText: string): any[] {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const paperFile = formData.get("paperFile") as File;
    const keyFile = formData.get("keyFile") as File | null;
    
    // Exam and Paper metadata
    let examIdStr = formData.get("exam_id") as string | null;
    const examPaperIdStr = formData.get("exam_paper_id") as string | null;
    const requestedTopicId = formData.get("topic_id") as string | null;
    
    // Universal range params
    const startQ = parseInt(formData.get("start_q") as string) || 1;
    const endQ = parseInt(formData.get("end_q") as string) || (startQ + 14);
    const existingPaperId = formData.get("source_paper_id") ? parseInt(formData.get("source_paper_id") as string) : null;
    
    if (!paperFile) {
      return NextResponse.json({ error: "No Question Paper PDF provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Server configuration missing: GEMINI_API_KEY is not set in environment variables" 
      }, { status: 500 });
    }

    const client = await db.pool.connect();

    try {
      // 1. Resolve Target Exam
      let exam: any = null;
      if (examIdStr) {
        const exRes = await client.query("SELECT id, name, code, syllabus_version FROM exams WHERE id = $1", [parseInt(examIdStr)]);
        if (exRes.rows.length > 0) exam = exRes.rows[0];
      }
      
      if (!exam) {
        // Default to GATE CS or first available exam
        const defExRes = await client.query("SELECT id, name, code, syllabus_version FROM exams WHERE code = 'GATE_CS' OR status IN ('READY_FOR_IMPORT', 'CONFIGURING', 'AVAILABLE') ORDER BY display_order ASC LIMIT 1");
        if (defExRes.rows.length > 0) exam = defExRes.rows[0];
      }

      if (!exam) {
        return NextResponse.json({ error: "No valid exam found in database. Please configure exams first." }, { status: 400 });
      }

      const activeExamId = exam.id;
      const examPaperId = examPaperIdStr ? parseInt(examPaperIdStr) : null;

      // 2. Query Official Taxonomy for THIS specific exam
      const topicsRes = await client.query(`
        SELECT t.id, t.name as topic_name, s.name as subject_name, s.id as subject_id
        FROM topics t
        JOIN subjects s ON t.subject_id = s.id
        WHERE s.exam_id = $1
        ORDER BY s.display_order ASC, s.id ASC, t.display_order ASC, t.id ASC
      `, [activeExamId]);

      const examTopics = topicsRes.rows;
      const validExamTopicIds = new Set(examTopics.map((t: any) => t.id));

      // Select reliable fallback topic for this exam (preferably General Aptitude or first topic)
      let examFallbackTopicId: number = examTopics.length > 0 ? examTopics[0].id : 1;
      const gaTopic = examTopics.find((t: any) => t.subject_name.toLowerCase().includes("aptitude") || t.topic_name.toLowerCase().includes("general"));
      if (gaTopic) examFallbackTopicId = gaTopic.id;

      // Format topics for Gemini prompt
      const topicsListPrompt = examTopics.map((t: any) => `ID ${t.id}: [${t.subject_name}] -> ${t.topic_name}`).join("\n");

      // 3. Convert PDFs to base64
      const paperBuffer = await paperFile.arrayBuffer();
      const paperBase64 = Buffer.from(paperBuffer).toString("base64");

      let keyBase64 = null;
      if (keyFile) {
        const keyBuffer = await keyFile.arrayBuffer();
        keyBase64 = Buffer.from(keyBuffer).toString("base64");
      }

      // 4. Create or reuse source_paper and import_job
      let sourcePaperId = existingPaperId;
      if (!sourcePaperId) {
        const insertPaperQuery = `
          INSERT INTO source_papers (paper_title, question_paper_file_path, status, exam_id, exam_paper_id, syllabus_version)
          VALUES ($1, $2, 'PROCESSING', $3, $4, $5)
          RETURNING id
        `;
        const paperRes = await client.query(insertPaperQuery, [
          paperFile.name || `${exam.name} Uploaded PDF`,
          'uploaded_file.pdf',
          activeExamId,
          examPaperId,
          exam.syllabus_version || 'STANDARD'
        ]);
        sourcePaperId = paperRes.rows[0].id;
      }

      const insertJobQuery = `
        INSERT INTO import_jobs (source_paper_id, exam_id, exam_paper_id, range_start, range_end, status)
        VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
        RETURNING id
      `;
      const jobRes = await client.query(insertJobQuery, [sourcePaperId, activeExamId, examPaperId, startQ, endQ]);
      const jobId = jobRes.rows[0].id;

      // 5. Call Gemini AI with Strict Taxonomy Guidance
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an expert universal competitive exam question digitization and classification engine.
You are ingesting questions for: "${exam.name}" (${exam.code || 'EXAM'}).

TASK:
Extract ONLY questions strictly numbered from Question ${startQ} to Question ${endQ} (inclusive).
Skip any questions with numbers outside this range.
${keyBase64 ? "Match each question with the attached Answer Key PDF to determine 'correct_answer'." : ""}

OFFICIAL SYLLABUS & TAXONOMY FOR ${exam.name}:
You MUST classify every extracted question into one of the following official Subject & Topic IDs:
${topicsListPrompt}

CRITICAL RULES:
1. Extract questions in order starting from Q${startQ} up to Q${endQ}.
2. Set "topic_id" to the EXACT integer ID from the official syllabus list above. NEVER invent new topic IDs or use categories from other exams.
3. Identify question type:
   - "MCQ": Single correct option
   - "MSQ": One or more correct options (Multiple Select)
   - "NAT": Numerical Answer Type (no options, has numerical range)
4. For MCQ/MSQ, extract options cleanly into option_a, option_b, option_c, option_d.
5. For NAT, extract nat_answer_min and nat_answer_max if given in key/solution.
6. Return ONLY the valid JSON array without any markdown wrappers or preamble.

Schema:
[
  {
    "question_number": "Q${startQ}",
    "topic_id": 12,
    "question_type": "MCQ" | "MSQ" | "NAT",
    "question_text": "The full question text with LaTeX formulas like $x^2$",
    "option_a": "Option A text",
    "option_b": "Option B text",
    "option_c": "Option C text",
    "option_d": "Option D text",
    "correct_answer": "A" or "B" or "C" or "D",
    "nat_answer_min": null,
    "nat_answer_max": null,
    "positive_marks": 1,
    "negative_marks": 0.33,
    "detailed_solution": "Brief 1-sentence solution explanation"
  }
]
`;

      const parts: any[] = [];
      parts.push({ inlineData: { data: paperBase64, mimeType: "application/pdf" } });
      if (keyBase64) {
        parts.push({ inlineData: { data: keyBase64, mimeType: "application/pdf" } });
      }
      parts.push({ text: prompt });

      let outputText = "";
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash"];
      let lastAiError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: parts }]
          });
          if (response.text) {
            outputText = response.text;
            break;
          }
        } catch (mErr: any) {
          lastAiError = mErr;
          console.warn(`Model ${modelName} failed or busy, trying alternative...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!outputText && lastAiError) {
        throw lastAiError;
      }

      let questionsArray: any[] = [];
      try {
        questionsArray = extractJsonArray(outputText);
      } catch (parseErr) {
        console.error("JSON parse failed, raw output:", outputText.slice(0, 500));
        throw new Error("AI extraction did not return valid JSON. Please try uploading the PDF again.");
      }

      // 6. Database Insertion within Transaction
      await client.query("BEGIN");
      let successCount = 0;

      for (let idx = 0; idx < questionsArray.length; idx++) {
        const q = questionsArray[idx];
        const qText = q.question_text || "";
        if (!qText.trim()) continue;

        // Content hash for deduplication
        const hash = crypto.createHash('sha256').update(qText.toLowerCase().trim()).digest('hex');
        const checkQ = await client.query("SELECT id FROM questions WHERE content_hash = $1 LIMIT 1", [hash]);
        
        let newQId: number;

        // Taxonomy Enforcement: strictly enforce that topic belongs to this exam
        const aiTopicId = parseInt(q.topic_id);
        const userTopicId = requestedTopicId ? parseInt(requestedTopicId) : null;
        
        let targetTopicId = examFallbackTopicId;
        if (validExamTopicIds.has(aiTopicId)) {
          targetTopicId = aiTopicId;
        } else if (userTopicId && validExamTopicIds.has(userTopicId)) {
          targetTopicId = userTopicId;
        }

        if (checkQ.rows.length > 0) {
          newQId = checkQ.rows[0].id;
        } else {
          const qType = q.question_type === 'MSQ' ? 'MSQ' : (q.question_type === 'NAT' ? 'NAT' : 'MCQ');

          const insertQQuery = `
            INSERT INTO questions (
              topic_id, question_text, detailed_solution,
              positive_marks, negative_marks, status,
              content_hash, question_type, nat_answer_min, nat_answer_max
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
          `;
          const qRes = await client.query(insertQQuery, [
            targetTopicId,
            qText,
            q.detailed_solution || "",
            parseFloat(q.positive_marks) || 1,
            parseFloat(q.negative_marks) || 0,
            "PENDING_REVIEW",
            hash,
            qType,
            qType === 'NAT' ? (parseFloat(q.nat_answer_min) || 0) : null,
            qType === 'NAT' ? (parseFloat(q.nat_answer_max) || 0) : null
          ]);

          newQId = qRes.rows[0].id;

          // Record many-to-many question_topics relationship
          await client.query(`
            INSERT INTO question_topics (question_id, topic_id, is_primary)
            VALUES ($1, $2, TRUE)
            ON CONFLICT (question_id, topic_id) DO NOTHING
          `, [newQId, targetTopicId]);

          // Options insertion for MCQ/MSQ
          if (qType === 'MCQ' || qType === 'MSQ') {
            const correctStr = String(q.correct_answer || 'A').toUpperCase();
            const isCorrectA = correctStr.includes('A') || correctStr.includes('1');
            const isCorrectB = correctStr.includes('B') || correctStr.includes('2');
            const isCorrectC = correctStr.includes('C') || correctStr.includes('3');
            const isCorrectD = correctStr.includes('D') || correctStr.includes('4');

            const insertOptQuery = `
              INSERT INTO options (question_id, option_text, is_correct)
              VALUES 
              ($1, $2, $3),
              ($4, $5, $6),
              ($7, $8, $9),
              ($10, $11, $12)
            `;
            
            await client.query(insertOptQuery, [
              newQId, q.option_a || "Option A", isCorrectA,
              newQId, q.option_b || "Option B", isCorrectB,
              newQId, q.option_c || "Option C", isCorrectC,
              newQId, q.option_d || "Option D", isCorrectD
            ]);
          }
        }

        // Link into paper_questions
        const qNumLabel = q.question_number || `Q${startQ + idx}`;
        await client.query(`
          INSERT INTO paper_questions (source_paper_id, question_id, question_number, marks, negative_marks)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (source_paper_id, question_id) DO NOTHING
        `, [sourcePaperId, newQId, qNumLabel, parseFloat(q.positive_marks) || 1, parseFloat(q.negative_marks) || 0.33]);

        successCount++;
      }

      // Update paper and job counts
      const totalQRes = await client.query(
        "SELECT COUNT(*) as cnt FROM paper_questions WHERE source_paper_id = $1",
        [sourcePaperId]
      );
      const totalInPaper = parseInt(totalQRes.rows[0].cnt) || successCount;

      await client.query(
        "UPDATE source_papers SET status = 'IMPORTED', total_questions = $1, extracted_count = $1 WHERE id = $2",
        [totalInPaper, sourcePaperId]
      );
      await client.query(
        "UPDATE import_jobs SET status = 'COMPLETED', total_questions_processed = $1, completed_at = now() WHERE id = $2",
        [successCount, jobId]
      );

      await client.query("COMMIT");

      return NextResponse.json({ 
        success: true,
        extracted_count: successCount,
        source_paper_id: sourcePaperId,
        exam_id: activeExamId,
        exam_name: exam.name,
        message: `Extracted ${successCount} questions (Q${startQ}–Q${endQ}) for ${exam.name} into Review Queue!` 
      });

    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("PDF AI extraction failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF." }, { status: 500 });
  }
}
