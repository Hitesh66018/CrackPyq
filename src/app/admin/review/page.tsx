import { CheckSquare, Check, X, Filter, Layers, HelpCircle, FileText, AlertTriangle, Edit3, ArrowRight } from "lucide-react";
import { revalidatePath } from "next/cache";
import MathText from "@/components/MathText";
import { db } from "@/utils/db";
import Link from "next/link";

export const instant = false;

// Inline Server Actions
async function approveQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  await pool.query("UPDATE questions SET status = 'PUBLISHED' WHERE id = $1", [id]);
  revalidatePath("/admin/review");
  revalidatePath("/admin/questions");
}

async function rejectQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  await pool.query("DELETE FROM options WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM test_questions WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM paper_questions WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM question_topics WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM questions WHERE id = $1", [id]);
  revalidatePath("/admin/review");
}

async function reclassifyQuestion(formData: FormData) {
  "use server";
  const questionId = formData.get("question_id") as string;
  const newTopicId = formData.get("topic_id") as string;
  if (!questionId || !newTopicId) return;

  const pool = db;
  await pool.query(
    "UPDATE questions SET topic_id = $1, is_unresolved = FALSE WHERE id = $2",
    [parseInt(newTopicId), parseInt(questionId)]
  );
  await pool.query(
    `INSERT INTO question_topics (question_id, topic_id, is_primary)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (question_id, topic_id) DO UPDATE SET is_primary = TRUE`,
    [parseInt(questionId), parseInt(newTopicId)]
  );
  revalidatePath("/admin/review");
  revalidatePath("/admin/questions");
}

async function approveAll(formData: FormData) {
  "use server";
  const examId = formData.get("exam_id") as string;
  const pool = db;
  if (examId) {
    await pool.query(`
      UPDATE questions SET status = 'PUBLISHED'
      WHERE id IN (
        SELECT q.id FROM questions q
        JOIN topics t ON q.topic_id = t.id
        JOIN subjects s ON t.subject_id = s.id
        WHERE s.exam_id = $1 AND q.status = 'PENDING_REVIEW'
      )
    `, [parseInt(examId)]);
  } else {
    await pool.query("UPDATE questions SET status = 'PUBLISHED' WHERE status = 'PENDING_REVIEW'");
  }
  revalidatePath("/admin/review");
  revalidatePath("/admin/questions");
}

async function rejectAll(formData: FormData) {
  "use server";
  const examId = formData.get("exam_id") as string;
  const pool = db;
  let targetIdsQuery = "SELECT id FROM questions WHERE status = 'PENDING_REVIEW'";
  const params: any[] = [];
  if (examId) {
    targetIdsQuery = `
      SELECT q.id FROM questions q
      JOIN topics t ON q.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      WHERE s.exam_id = $1 AND q.status = 'PENDING_REVIEW'
    `;
    params.push(parseInt(examId));
  }
  await pool.query(`DELETE FROM options WHERE question_id IN (${targetIdsQuery})`, params);
  await pool.query(`DELETE FROM test_questions WHERE question_id IN (${targetIdsQuery})`, params);
  await pool.query(`DELETE FROM paper_questions WHERE question_id IN (${targetIdsQuery})`, params);
  await pool.query(`DELETE FROM question_topics WHERE question_id IN (${targetIdsQuery})`, params);
  await pool.query(`DELETE FROM questions WHERE status = 'PENDING_REVIEW' ${examId ? 'AND id IN (' + targetIdsQuery + ')' : ''}`, params);
  revalidatePath("/admin/review");
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const filterExamId = resolvedParams.exam_id as string | undefined;

  const pool = db;

  // 1. Fetch exams count for filter tabs
  const examsCountRes = await pool.query(`
    SELECT e.id, e.name, e.code, COUNT(q.id) as pending_count
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN exams e ON s.exam_id = e.id
    WHERE q.status = 'PENDING_REVIEW'
    GROUP BY e.id, e.name, e.code
    ORDER BY pending_count DESC, e.name ASC
  `);

  // 2. Fetch all valid syllabus topics grouped by exam for the Reclassify dropdown
  const allTopicsRes = await pool.query(`
    SELECT t.id, t.name as topic_name, s.name as subject_name, s.exam_id, e.name as exam_name
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN exams e ON s.exam_id = e.id
    WHERE t.code NOT LIKE '%UNRESOLVED%'
    ORDER BY e.name, s.display_order, t.display_order
  `);

  const topicsByExam: Record<number, any[]> = {};
  for (const row of allTopicsRes.rows) {
    if (!topicsByExam[row.exam_id]) topicsByExam[row.exam_id] = [];
    topicsByExam[row.exam_id].push(row);
  }

  // 3. Query questions with strict taxonomy provenance
  let query = `
    SELECT 
      q.id, q.question_text, q.status, q.question_type, q.exam_year,
      q.ors_code, q.is_marks_to_all, q.is_unresolved,
      q.positive_marks, q.negative_marks, q.detailed_solution,
      q.nat_answer_min, q.nat_answer_max, q.reviewer_notes,
      t.id as topic_id,
      t.name as topic_name,
      t.code as topic_code,
      s.id as subject_id,
      s.name as subject_name,
      e.id as exam_id,
      e.name as exam_name,
      e.code as exam_code,
      c.name as category_name,
      pq.question_number,
      sp.paper_title,
      sp.year as source_paper_year,
      COALESCE(
        json_agg(
          json_build_object('id', o.id, 'option_text', o.option_text, 'is_correct', o.is_correct)
        ) FILTER (WHERE o.id IS NOT NULL), '[]'
      ) as options
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN exams e ON s.exam_id = e.id
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN options o ON q.id = o.question_id
    LEFT JOIN paper_questions pq ON q.id = pq.question_id
    LEFT JOIN source_papers sp ON pq.source_paper_id = sp.id
    WHERE q.status = 'PENDING_REVIEW'
  `;

  const queryParams: any[] = [];
  if (filterExamId) {
    queryParams.push(parseInt(filterExamId));
    query += ` AND e.id = $${queryParams.length}`;
  }

  query += `
    GROUP BY q.id, t.id, t.name, t.code, s.id, s.name, e.id, e.name, e.code, c.name, pq.question_number, sp.paper_title, sp.year
    ORDER BY q.id ASC
    LIMIT 100
  `;

  const result = await pool.query(query, queryParams);
  const questions = result.rows;
  const totalPending = questions.length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-emerald-500" /> Universal Review Queue
          </h2>
          <p className="text-gray-400">
            Verify extracted and classified questions before publishing to the live student question bank.
          </p>
        </div>
        
        {totalPending > 0 && (
          <div className="flex items-center gap-3">
            <form action={rejectAll}>
              <input type="hidden" name="exam_id" value={filterExamId || ""} />
              <button 
                type="submit" 
                className="px-4 py-2 bg-gray-900 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-950/40 flex items-center gap-2 text-sm transition-colors"
              >
                <X size={16} /> Reject {filterExamId ? 'Filtered' : 'All'}
              </button>
            </form>
            <form action={approveAll}>
              <input type="hidden" name="exam_id" value={filterExamId || ""} />
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm transition-colors shadow-sm"
              >
                <Check size={16} /> Approve & Publish {filterExamId ? 'Filtered' : 'All'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Filter Tabs by Exam */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-800">
        <Link
          href="/admin/review"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            !filterExamId 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          All Exams ({examsCountRes.rows.reduce((acc: number, r: any) => acc + parseInt(r.pending_count), 0)})
        </Link>
        {examsCountRes.rows.map((ex: any) => (
          <Link
            key={ex.id}
            href={`/admin/review?exam_id=${ex.id}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterExamId === String(ex.id)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <span>{ex.name}</span>
            <span className="bg-black/40 px-1.5 py-0.2 rounded-full text-[10px] text-gray-300">
              {ex.pending_count}
            </span>
          </Link>
        ))}
      </div>

      {/* Questions Cards List */}
      <div className="grid gap-6">
        {questions && questions.length > 0 ? (
          questions.map((q: any) => {
            const isUnresolved = q.is_unresolved || q.topic_code === 'GATE_CS_UNRESOLVED' || !q.topic_id;
            const examLabel = q.exam_name || "GATE CSE";
            const yearLabel = q.exam_year || q.source_paper_year || 2013;
            const paperLabel = "Computer Science and Information Technology";
            const examTopicsList = topicsByExam[q.exam_id] || [];

            return (
              <div key={q.id} className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="p-6 flex-1 space-y-4">
                  
                  {/* Strict Provenance Breadcrumb */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-blue-400">{examLabel}</span>
                    <span className="text-gray-600">&rarr;</span>
                    <span className="font-semibold text-gray-300">{yearLabel}</span>
                    <span className="text-gray-600">&rarr;</span>
                    
                    {isUnresolved ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} /> Subject/Topic Needs Review
                      </span>
                    ) : (
                      <>
                        <span className="text-gray-400">{paperLabel}</span>
                        <span className="text-gray-600">&rarr;</span>
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-medium">
                          {q.subject_name}
                        </span>
                        <span className="text-gray-600">&rarr;</span>
                        <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                          {q.topic_name}
                        </span>
                      </>
                    )}

                    {/* Meta Badges */}
                    <span className="ml-auto bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded font-mono">
                      {q.question_type || "MCQ"}
                    </span>
                    {q.question_number && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-bold font-mono">
                        {q.question_number}
                      </span>
                    )}
                    {q.ors_code && (
                      <span className="bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded font-mono">
                        ORS Code: {q.ors_code}
                      </span>
                    )}
                  </div>

                  {/* Marks to All Special Outcome Banner */}
                  {q.is_marks_to_all && (
                    <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold">
                      <span>🌟 Marks to All: Official Answer Key granted full marks to all candidates for this question.</span>
                    </div>
                  )}

                  {/* Question Content */}
                  <div className="text-gray-100 font-medium text-base leading-relaxed">
                    <MathText content={q.question_text} />
                  </div>
                  
                  {/* Options or NAT Value */}
                  {q.question_type === 'NAT' ? (
                    <div className="p-4 rounded-lg bg-gray-950 border border-gray-800 text-sm">
                      <span className="font-semibold text-gray-400 block mb-1">Numerical Answer Key:</span>
                      <span className="text-emerald-400 font-mono text-base">
                        Range: [{q.nat_answer_min ?? "N/A"} to {q.nat_answer_max ?? "N/A"}]
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Options:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt: any, idx: number) => (
                          <div 
                            key={opt.id} 
                            className={`p-3 rounded-lg border text-sm transition-colors ${
                              opt.is_correct 
                                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200 font-medium' 
                                : 'bg-gray-950 border-gray-800 text-gray-300'
                            }`}
                          >
                            <span className="mr-2 font-bold font-mono text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                            <MathText content={opt.option_text} />
                            {opt.is_correct && <Check size={16} className="inline ml-2 text-emerald-400" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solution */}
                  {q.detailed_solution && (
                    <div className="text-xs text-gray-400 bg-gray-950/80 border border-gray-800/60 p-3 rounded-lg">
                      <strong className="text-gray-300">Solution / Key Note: </strong>
                      <MathText content={q.detailed_solution} />
                    </div>
                  )}

                  {/* Inline Reclassify Form */}
                  <div className="pt-2 border-t border-gray-800/60 flex flex-wrap items-center gap-3">
                    <form action={reclassifyQuestion} className="flex items-center gap-2 flex-wrap">
                      <input type="hidden" name="question_id" value={q.id} />
                      <label className="text-xs text-gray-400 flex items-center gap-1">
                        <Edit3 size={13} className="text-blue-400" /> Reclassify Subject/Topic:
                      </label>
                      <select
                        name="topic_id"
                        defaultValue={q.topic_id || ""}
                        className="bg-gray-950 border border-gray-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 max-w-xs"
                      >
                        <option value="" disabled>-- Select Verified Syllabus Topic --</option>
                        {examTopicsList.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            [{t.subject_name}] &rarr; {t.topic_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Actions Panel */}
                <div className="bg-gray-950 border-t md:border-t-0 md:border-l border-gray-800 p-6 flex md:flex-col justify-center gap-3 w-full md:w-56">
                  <form action={approveQuestion} className="flex-1 md:flex-none">
                    <input type="hidden" name="id" value={q.id} />
                    <button 
                      type="submit" 
                      className="w-full bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-500 flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
                    >
                      <Check size={18} /> Approve
                    </button>
                  </form>
                  <form action={rejectQuestion} className="flex-1 md:flex-none">
                    <input type="hidden" name="id" value={q.id} />
                    <button 
                      type="submit" 
                      className="w-full bg-gray-900 border border-red-500/30 text-red-400 font-semibold px-4 py-2.5 rounded-lg hover:bg-red-950/40 flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <X size={18} /> Reject
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-gray-900 rounded-xl border border-dashed border-gray-800 p-12 text-center">
            <div className="mx-auto bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckSquare size={30} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Review Queue is Clean!</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              All questions have been approved and published to the Question Bank. You can ingest more questions from the PDF Import pipeline.
            </p>
            <div className="mt-5">
              <Link
                href="/admin/questions/import-pdf"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm"
              >
                Import Question Papers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
