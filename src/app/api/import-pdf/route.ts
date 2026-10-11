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
    
    // Strict metadata retrieval - NO UNSAFE FALLBACKS
    const examIdStr = formData.get("exam_id") as string | null;
    if (!examIdStr || !examIdStr.trim()) {
      return NextResponse.json({ 
        error: "Exam must be explicitly selected before importing. Silent cross-exam defaulting is strictly prohibited." 
      }, { status: 400 });
    }

    const yearStr = formData.get("year") as string | null;
    const year = yearStr ? parseInt(yearStr) : 2013;
    const orsCode = ((formData.get("ors_code") as string) || "A").trim().toUpperCase();
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
      // 1. Verify Target Exam strictly
      const exRes = await client.query(
        "SELECT id, name, code, syllabus_version FROM exams WHERE id = $1", 
        [parseInt(examIdStr)]
      );
      if (exRes.rows.length === 0) {
        return NextResponse.json({ 
          error: `Invalid exam_id: "${examIdStr}". No corresponding exam found in catalog.` 
        }, { status: 400 });
      }

      const exam = exRes.rows[0];
      const activeExamId = exam.id;
      const examPaperId = examPaperIdStr && examPaperIdStr !== "custom" ? parseInt(examPaperIdStr) : null;

      // 2. Query Official Taxonomy for THIS specific exam
      const topicsRes = await client.query(`
        SELECT t.id, t.name as topic_name, t.code as topic_code, s.name as subject_name, s.id as subject_id
        FROM topics t
        JOIN subjects s ON t.subject_id = s.id
        WHERE s.exam_id = $1
        ORDER BY s.display_order ASC, s.id ASC, t.display_order ASC, t.id ASC
      `, [activeExamId]);

      const examTopics = topicsRes.rows;
      if (examTopics.length === 0) {
        return NextResponse.json({ 
          error: `Selected exam "${exam.name}" has no registered syllabus topics. Please configure its syllabus before importing.` 
        }, { status: 400 });
      }

      const validExamTopicIds = new Set(examTopics.map((t: any) => t.id));

      // Resolve designated Unresolved topic for this exam
      let unresolvedTopic = examTopics.find((t: any) => 
        (t.topic_code && t.topic_code.includes("UNRESOLVED")) || 
        t.topic_name.toLowerCase().includes("needs review") ||
        t.topic_name.toLowerCase().includes("uncategorized")
      );
      if (!unresolvedTopic) {
        unresolvedTopic = examTopics[0];
      }
      const unresolvedTopicId = unresolvedTopic.id;

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
        const paperTitle = (paperFile.name || `${exam.name} ${year}`).replace(/\.pdf$/i, "");
        const insertPaperQuery = `
          INSERT INTO source_papers (paper_title, question_paper_file_path, status, exam_id, exam_paper_id, year, ors_code, syllabus_version)
          VALUES ($1, $2, 'PROCESSING', $3, $4, $5, $6, $7)
          RETURNING id
        `;
        const paperRes = await client.query(insertPaperQuery, [
          paperTitle,
          'uploaded_file.pdf',
          activeExamId,
          examPaperId,
          year,
          orsCode,
          exam.syllabus_version || 'STANDARD'
        ]);
        sourcePaperId = paperRes.rows[0].id;
      }

      const insertJobQuery = `
        INSERT INTO import_jobs (source_paper_id, exam_id, exam_paper_id, ors_code, range_start, range_end, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSING')
        RETURNING id
      `;
      const jobRes = await client.query(insertJobQuery, [sourcePaperId, activeExamId, examPaperId, orsCode, startQ, endQ]);
      const jobId = jobRes.rows[0].id;

      // 5. Answer Key Guidance
      const keyInstructions = keyBase64 ? `
ANSWER KEY MATCHING INSTRUCTIONS:
An official Answer Key PDF is attached.
- Target Booklet / ORS Code is: "${orsCode}".
- Look at the answer key table. Locate the column corresponding to "ORS code ${orsCode}" (or "ORS Code ${orsCode}").
- For each question numbered Q${startQ} to Q${endQ}:
  1. Match STRICTLY by the original question number (Q.No). NEVER match by array index or order.
  2. If the value in the "ORS code ${orsCode}" column is "Marks to All" (or "MTA"):
     - Set "is_marks_to_all": true
     - Set "correct_answer": "MARKS_TO_ALL"
  3. If the value is a single letter (e.g., 'A', 'B', 'C', 'D'):
     - Set "is_marks_to_all": false
     - Set "correct_answer": "A" (or whatever the letter is)
  4. If multiple letters are given (e.g. 'A, B' or 'A or C'):
     - Set "correct_answer": "A,B"
  5. If the answer is numerical, set nat_answer_min and nat_answer_max accordingly.
` : `
NOTE: No answer key PDF provided. Use solutions within the question paper or deduce the correct answer.
`;

      // 6. Call Gemini AI with Strict Taxonomy & ORS Guidance
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an expert universal competitive exam question digitization and classification engine.
Exam: "${exam.name}" (${exam.code})
Year: ${year}
Booklet / ORS Code: ${orsCode}

TASK:
Extract ONLY questions numbered strictly from Question ${startQ} to Question ${endQ} (inclusive).
Skip any questions outside this range.
${keyInstructions}

OFFICIAL SYLLABUS TAXONOMY FOR ${exam.name}:
You MUST classify each question into one of the following official Topic IDs:
${topicsListPrompt}

CLASSIFICATION RULES:
1. For each question, assign "topic_id" matching the most specific relevant Topic ID above.
2. If none of the specific topics are a confident match, assign "topic_id": ${unresolvedTopicId}.
3. NEVER invent topic IDs or borrow from other exams.

QUESTION STRUCTURE RULES:
- Identify question_type: "MCQ" | "MSQ" | "NAT"
- In GATE CSE:
  - Q1 to Q25 are 1-mark questions (negative mark: 0.33 for MCQ).
  - Q26 to Q55 are 2-mark questions (negative mark: 0.67 for MCQ).
  - Q56 to Q65 are General Aptitude (Q56-Q60: 1 mark, Q61-Q65: 2 marks).
- For MCQ/MSQ, clean options into option_a, option_b, option_c, option_d.
- Return ONLY the valid JSON array without any markdown wrappers or preamble.

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
    "correct_answer": "A" or "B" or "C" or "D" or "MARKS_TO_ALL",
    "is_marks_to_all": false,
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

      // 7. Database Insertion within Transaction
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

        // Strict Taxonomy Validation
        const aiTopicId = parseInt(q.topic_id);
        const userTopicId = requestedTopicId ? parseInt(requestedTopicId) : null;
        
        let targetTopicId = unresolvedTopicId;
        let isUnresolved = true;

        if (validExamTopicIds.has(aiTopicId) && aiTopicId !== unresolvedTopicId) {
          targetTopicId = aiTopicId;
          isUnresolved = false;
        } else if (userTopicId && validExamTopicIds.has(userTopicId)) {
          targetTopicId = userTopicId;
          isUnresolved = false;
        }

        // Marks to All Detection
        const isMarksToAll = Boolean(
          q.is_marks_to_all === true ||
          String(q.correct_answer || "").toUpperCase().includes("MARKS TO ALL") ||
          String(q.correct_answer || "").toUpperCase() === "MTA"
        );

        if (checkQ.rows.length > 0) {
          newQId = checkQ.rows[0].id;
        } else {
          const qType = q.question_type === 'MSQ' ? 'MSQ' : (q.question_type === 'NAT' ? 'NAT' : 'MCQ');

          const insertQQuery = `
            INSERT INTO questions (
              topic_id, exam_year, ors_code, is_marks_to_all, is_unresolved,
              question_text, detailed_solution,
              positive_marks, negative_marks, status,
              content_hash, question_type, nat_answer_min, nat_answer_max,
              reviewer_notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
          `;
          const qRes = await client.query(insertQQuery, [
            targetTopicId,
            year,
            orsCode,
            isMarksToAll,
            isUnresolved,
            qText,
            q.detailed_solution || "",
            parseFloat(q.positive_marks) || 1,
            parseFloat(q.negative_marks) || 0,
            "PENDING_REVIEW",
            hash,
            qType,
            qType === 'NAT' ? (parseFloat(q.nat_answer_min) || 0) : null,
            qType === 'NAT' ? (parseFloat(q.nat_answer_max) || 0) : null,
            isMarksToAll ? "Official Answer Key: Marks to All" : null
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
            const correctStr = String(q.correct_answer || '').toUpperCase();
            
            // If Marks to All, every candidate receives credit
            const isCorrectA = isMarksToAll || correctStr.includes('A') || correctStr.includes('1');
            const isCorrectB = isMarksToAll || correctStr.includes('B') || correctStr.includes('2');
            const isCorrectC = isMarksToAll || correctStr.includes('C') || correctStr.includes('3');
            const isCorrectD = isMarksToAll || correctStr.includes('D') || correctStr.includes('4');

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
        year: year,
        ors_code: orsCode,
        message: `Extracted ${successCount} questions (Q${startQ}–Q${endQ}) for ${exam.name} (${year}, Code ${orsCode}) into Review Queue!` 
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
