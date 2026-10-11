import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("exam_id");

    const pool = db;

    if (examId) {
      // Fetch details for a specific exam: subjects, topics, and configured exam papers
      const examRes = await pool.query(
        `SELECT e.id, e.name, e.code, e.status, e.syllabus_version, c.name as category_name
         FROM exams e
         LEFT JOIN categories c ON e.category_id = c.id
         WHERE e.id = $1`,
        [examId]
      );

      if (examRes.rows.length === 0) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }

      const exam = examRes.rows[0];

      // Subjects and topics
      const subjectsRes = await pool.query(
        `SELECT s.id as subject_id, s.name as subject_name, s.code as subject_code,
                t.id as topic_id, t.name as topic_name, t.code as topic_code
         FROM subjects s
         LEFT JOIN topics t ON s.id = t.subject_id
         WHERE s.exam_id = $1
         ORDER BY s.display_order ASC, s.id ASC, t.display_order ASC, t.id ASC`,
        [examId]
      );

      const subjectsMap: Record<number, any> = {};
      for (const row of subjectsRes.rows) {
        if (!subjectsMap[row.subject_id]) {
          subjectsMap[row.subject_id] = {
            id: row.subject_id,
            name: row.subject_name,
            code: row.subject_code,
            topics: []
          };
        }
        if (row.topic_id) {
          subjectsMap[row.subject_id].topics.push({
            id: row.topic_id,
            name: row.topic_name,
            code: row.topic_code
          });
        }
      }

      // Exam papers (e.g. 2024, 2023, 2013...)
      const papersRes = await pool.query(
        `SELECT ep.id, ep.year, ep.session_name, ep.code, ep.total_marks
         FROM exam_papers ep
         WHERE ep.exam_id = $1
         ORDER BY ep.year DESC, ep.session_name ASC`,
        [examId]
      );

      const formattedPapers = papersRes.rows.map(p => ({
        id: p.id,
        year: p.year,
        paper_year: p.year,
        paper_name: p.session_name || `Paper ${p.year}`,
        paper_code: p.code || `PAPER_${p.year}`,
        total_marks: p.total_marks
      }));

      return NextResponse.json({
        exam,
        subjects: Object.values(subjectsMap),
        papers: formattedPapers
      });
    }

    // List all exams grouped by category
    const examsRes = await pool.query(
      `SELECT e.id, e.name, e.code, e.status, e.total_papers, e.syllabus_version, e.display_order,
              c.id as category_id, c.name as category_name, c.code as category_code,
              COUNT(DISTINCT s.id) as subjects_count,
              COUNT(DISTINCT ep.id) as configured_papers_count
       FROM exams e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN subjects s ON e.id = s.exam_id
       LEFT JOIN exam_papers ep ON e.id = ep.exam_id
       GROUP BY e.id, e.name, e.code, e.status, e.total_papers, e.syllabus_version, e.display_order, c.id, c.name, c.code
       ORDER BY c.display_order ASC NULLS LAST, e.display_order ASC, e.name ASC`
    );

    return NextResponse.json({
      exams: examsRes.rows
    });
  } catch (error: any) {
    console.error("Taxonomy API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load taxonomy" }, { status: 500 });
  }
}
