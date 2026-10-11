import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";
import { db } from '@/utils/db';

export const maxDuration = 60; // Next.js serverless function max duration

// Helper to clean and parse JSON from AI response
function extractJsonArray(rawText: string): any[] {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  
  // Find array bounds
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
    const topic_id = formData.get("topic_id") as string || "1";
    const exam_id = formData.get("exam_id") as string || null;
    const batch_range = formData.get("batch_range") as string || "1-30";
    
    if (!paperFile) {
      return NextResponse.json({ error: "No Question Paper PDF provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Server configuration missing: GEMINI_API_KEY is not set in environment variables" 
      }, { status: 500 });
    }

    // Convert paper to base64
    const paperBuffer = await paperFile.arrayBuffer();
    const paperBase64 = Buffer.from(paperBuffer).toString("base64");

    // Convert key to base64 if it exists
    let keyBase64 = null;
    if (keyFile) {
      const keyBuffer = await keyFile.arrayBuffer();
      keyBase64 = Buffer.from(keyBuffer).toString("base64");
    }

    // Fetch available topics for AI to classify
    const { data: topicsData } = await supabase.from("topics").select("id, name, subject:subjects(name)");
    const topicsList = topicsData?.map((t: any) => `ID ${t.id}: ${t.subject?.name} - ${t.name}`).join("\n") || "1: General";

    const ai = new GoogleGenAI({ apiKey });

    const client = await db.pool.connect();
    
    // 1. Create a Source Paper record
    const insertPaperQuery = `
      INSERT INTO source_papers (paper_title, question_paper_file_path, status, exam_id)
      VALUES ($1, $2, 'PROCESSING', $3)
      RETURNING id
    `;
    const paperRes = await client.query(insertPaperQuery, [paperFile.name || 'Uploaded PDF', 'uploaded_file.pdf', exam_id ? parseInt(exam_id) : null]);
    const sourcePaperId = paperRes.rows[0].id;
    
    // 2. Create an Import Job
    const insertJobQuery = `
      INSERT INTO import_jobs (source_paper_id, status)
      VALUES ($1, 'PROCESSING')
      RETURNING id
    `;
    const jobRes = await client.query(insertJobQuery, [sourcePaperId]);
    const jobId = jobRes.rows[0].id;

    let successCount = 0;
    const crypto = require('crypto');

    try {
      let rangeInstruction = "Extract ALL questions present in this paper.";
      if (batch_range === "1-30") {
        rangeInstruction = "Extract questions numbered from Q1 to Q30 (or the first 30 questions).";
      } else if (batch_range === "31-65") {
        rangeInstruction = "Extract questions numbered from Q31 to Q65.";
      } else if (batch_range === "1-65") {
        rangeInstruction = "Extract questions numbered from Q1 to Q65.";
      }

      let prompt = `
You are an expert competitive exam question digitization engine.
Read the attached Question Paper PDF carefully.

${rangeInstruction}
`;

      if (keyBase64) {
        prompt += `
I have ALSO attached the official Answer Key PDF.
CRITICAL: Match every question number in the question paper with its corresponding answer in the answer key to accurately set 'correct_answer'.
`;
      }

      prompt += `
Return a JSON array of objects with the following schema:
[
  {
    "question_number": "Q1",
    "question_type": "MCQ" | "MSQ" | "NAT",
    "question_text": "The full question text with mathematical formulas formatted in LaTeX like $x^2$ or $$\\frac{a}{b}$$",
    "option_a": "Option A text (leave empty if NAT)",
    "option_b": "Option B text (leave empty if NAT)",
    "option_c": "Option C text (leave empty if NAT)",
    "option_d": "Option D text (leave empty if NAT)",
    "correct_answer": "A" or "B,C" for MSQ (leave empty if NAT)",
    "nat_answer_min": null or minimum accepted numerical value if NAT,
    "nat_answer_max": null or maximum accepted numerical value if NAT,
    "positive_marks": 1 or 2,
    "negative_marks": 0.33 or 0.66 (0 for NAT),
    "detailed_solution": "Short 1-sentence solution explanation"
  }
]

IMPORTANT RULES:
1. Extract ALL questions from the document without skipping any.
2. For NAT (Numerical Answer Type) questions: set question_type to 'NAT', leave options empty, and provide nat_answer_min and nat_answer_max numbers.
3. For MSQ (Multiple Select Questions): set question_type to 'MSQ' and correct_answer like 'A,C'.
4. For MCQ (Single Choice): set question_type to 'MCQ' and correct_answer to 'A', 'B', 'C', or 'D'.
5. Respond ONLY with the valid JSON array. Do not include markdown preamble.
`;

      const parts: any[] = [];
      parts.push({ inlineData: { data: paperBase64, mimeType: "application/pdf" } });
      if (keyBase64) {
        parts.push({ inlineData: { data: keyBase64, mimeType: "application/pdf" } });
      }
      parts.push({ text: prompt });

      // Use gemini-3.5-flash for speed, 1M context token support, and high accuracy
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: parts }]
      });

      const outputText = response.text || "";
      let questionsArray: any[] = [];
      
      try {
        questionsArray = extractJsonArray(outputText);
      } catch (parseErr) {
        console.error("JSON parse failed, raw output sample:", outputText.slice(0, 500));
        throw new Error("AI did not return valid JSON. Please try uploading the PDF again.");
      }

      if (questionsArray.length === 0) {
        throw new Error("No questions were detected in the provided PDF.");
      }

      await client.query("BEGIN");

      for (let idx = 0; idx < questionsArray.length; idx++) {
        const q = questionsArray[idx];
        const qText = q.question_text || "";
        if (!qText.trim()) continue;

        // Hash for deduplication
        const hash = crypto.createHash('sha256').update(qText.toLowerCase().trim()).digest('hex');
        
        // Check if question exists
        const checkQ = await client.query("SELECT id FROM questions WHERE content_hash = $1 LIMIT 1", [hash]);
        let newQId;
        
        if (checkQ.rows.length > 0) {
          newQId = checkQ.rows[0].id;
        } else {
          const qType = q.question_type === 'MSQ' ? 'MSQ' : (q.question_type === 'NAT' ? 'NAT' : 'MCQ');
          
          const insertQQuery = `
            INSERT INTO questions (topic_id, question_text, detailed_solution, positive_marks, negative_marks, status, content_hash, question_type, nat_answer_min, nat_answer_max)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
          `;
          const qRes = await client.query(insertQQuery, [
            parseInt(q.topic_id) || parseInt(topic_id) || 1,
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

          // Insert options if MCQ or MSQ
          if (qType === 'MCQ' || qType === 'MSQ') {
            const correctStr = String(q.correct_answer || 'A').toUpperCase();
            const isCorrectA = correctStr.includes('A');
            const isCorrectB = correctStr.includes('B');
            const isCorrectC = correctStr.includes('C');
            const isCorrectD = correctStr.includes('D');

            const insertOptQuery = `
              INSERT INTO options (question_id, option_text, is_correct)
              VALUES 
              ($1, $2, $3),
              ($1, $4, $5),
              ($1, $6, $7),
              ($1, $8, $9)
            `;
            
            await client.query(insertOptQuery, [
              newQId, q.option_a || "Option A", isCorrectA,
              newQId, q.option_b || "Option B", isCorrectB,
              newQId, q.option_c || "Option C", isCorrectC,
              newQId, q.option_d || "Option D", isCorrectD
            ]);
          }
        }
        
        // Link to Source Paper
        const qNumLabel = q.question_number || `Q${idx + 1}`;
        await client.query(`
          INSERT INTO paper_questions (source_paper_id, question_id, question_number, marks, negative_marks)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (source_paper_id, question_id) DO NOTHING
        `, [sourcePaperId, newQId, qNumLabel, parseFloat(q.positive_marks) || 1, parseFloat(q.negative_marks) || 0.33]);

        successCount++;
      }
      
      // Update jobs and papers
      await client.query("UPDATE source_papers SET status = 'IMPORTED', total_questions = $1 WHERE id = $2", [successCount, sourcePaperId]);
      await client.query("UPDATE import_jobs SET status = 'COMPLETED', total_questions_processed = $1, completed_at = now() WHERE id = $2", [successCount, jobId]);
      await client.query("COMMIT");
      
    } catch (err: any) {
      await client.query("UPDATE source_papers SET status = 'FAILED' WHERE id = $1", [sourcePaperId]);
      await client.query("UPDATE import_jobs SET status = 'FAILED', error_details = $1, completed_at = now() WHERE id = $2", [err.message, jobId]);
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ 
      message: `Successfully fused ${successCount} questions and answers into the Review Queue!` 
    });

  } catch (error: any) {
    console.error("PDF AI extraction failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF." }, { status: 500 });
  }
}
