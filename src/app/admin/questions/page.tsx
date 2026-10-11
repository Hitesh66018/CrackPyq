import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Filter, Edit, Trash2, ChevronRight, Folder } from "lucide-react";
import MathText from "@/components/MathText";
import { revalidatePath } from "next/cache";
import { db } from '@/utils/db';

export const instant = false;

async function deleteQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  await pool.query("DELETE FROM options WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM test_questions WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM paper_questions WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM questions WHERE id = $1", [id]);
  revalidatePath("/admin/questions");
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const exam_id = resolvedParams.exam_id as string;
  const subject_id = resolvedParams.subject_id as string;
  const topic_id = resolvedParams.topic_id as string;
  const search = resolvedParams.search as string;

  const pool = db;

  // Fetch Taxonomy Tree
  const treeRes = await pool.query(`
    SELECT e.id as exam_id, e.name as exam_name,
           s.id as subject_id, s.name as subject_name,
           t.id as topic_id, t.name as topic_name
    FROM exams e
    LEFT JOIN subjects s ON e.id = s.exam_id
    LEFT JOIN topics t ON s.id = t.subject_id
    ORDER BY e.name, s.name, t.name
  `);

  // Build the tree object
  const tree: any = {};
  for (const row of treeRes.rows) {
    if (!tree[row.exam_id]) tree[row.exam_id] = { id: row.exam_id, name: row.exam_name, subjects: {} };
    if (row.subject_id) {
      if (!tree[row.exam_id].subjects[row.subject_id]) {
        tree[row.exam_id].subjects[row.subject_id] = { id: row.subject_id, name: row.subject_name, topics: {} };
      }
      if (row.topic_id) {
        tree[row.exam_id].subjects[row.subject_id].topics[row.topic_id] = { id: row.topic_id, name: row.topic_name };
      }
    }
  }

  // Fetch Questions
  let qQuery = `
    SELECT q.id, q.question_text, q.status, q.difficulty, q.question_type,
           t.name as topic_name, s.name as subject_name, e.name as exam_name
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN exams e ON s.exam_id = e.id
    WHERE q.status != 'PENDING_REVIEW'
  `;
  const qParams: any[] = [];
  
  if (topic_id) {
    qParams.push(topic_id);
    qQuery += ` AND q.topic_id = $${qParams.length}`;
  } else if (subject_id) {
    qParams.push(subject_id);
    qQuery += ` AND t.subject_id = $${qParams.length}`;
  } else if (exam_id) {
    qParams.push(exam_id);
    qQuery += ` AND s.exam_id = $${qParams.length}`;
  }

  if (search) {
    qParams.push(`%${search}%`);
    qQuery += ` AND q.question_text ILIKE $${qParams.length}`;
  }

  qQuery += ` ORDER BY q.id DESC LIMIT 50`;

  const qRes = await pool.query(qQuery, qParams);
  const questions = qRes.rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Question Bank (Scaled)</h2>
          <p className="text-gray-400 mt-1">Manage all questions with the hierarchical faceted browser.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin/questions/import-pdf" 
            className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            Import PDF
          </Link>
          <Link 
            href="/admin/questions/new" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Add Question
          </Link>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left Sidebar: Taxonomy Tree */}
        <div className="w-64 flex-shrink-0 bg-[#111624] rounded-xl border border-white/10 p-4 overflow-y-auto max-h-[800px]">
          <h3 className="font-bold text-white mb-4 px-2 tracking-wide uppercase text-xs">Taxonomy</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/admin/questions" className={`block px-2 py-1.5 rounded-lg text-sm transition-colors ${!exam_id ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                All Questions
              </Link>
            </li>
            {Object.values(tree).map((exam: any) => (
              <li key={exam.id} className="pt-2">
                <Link 
                  href={`/admin/questions?exam_id=${exam.id}`} 
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-bold transition-colors ${exam_id == exam.id ? 'bg-purple-500/20 text-purple-400' : 'text-white hover:bg-white/5'}`}
                >
                  <Folder size={14} className={exam_id == exam.id ? "text-purple-400" : "text-gray-500"} />
                  {exam.name}
                </Link>
                {/* Subjects */}
                {(exam_id == exam.id || subject_id) && (
                  <ul className="pl-4 mt-1 border-l ml-3 border-white/10 space-y-1">
                    {Object.values(exam.subjects).map((subj: any) => (
                      <li key={subj.id}>
                        <Link 
                          href={`/admin/questions?exam_id=${exam.id}&subject_id=${subj.id}`} 
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${subject_id == subj.id ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                          <ChevronRight size={14} className="text-gray-600" />
                          {subj.name}
                        </Link>
                        {/* Topics */}
                        {subject_id == subj.id && (
                          <ul className="pl-6 mt-1 space-y-1">
                            {Object.values(subj.topics).map((top: any) => (
                              <li key={top.id}>
                                <Link 
                                  href={`/admin/questions?exam_id=${exam.id}&subject_id=${subj.id}&topic_id=${top.id}`} 
                                  className={`block px-2 py-1 rounded-lg text-xs transition-colors ${topic_id == top.id ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                                >
                                  {top.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Data Grid */}
        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Filters Bar */}
          <div className="bg-[#111624] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-4">
            <form action="/admin/questions" method="GET" className="relative flex-1 flex">
              {exam_id && <input type="hidden" name="exam_id" value={exam_id} />}
              {subject_id && <input type="hidden" name="subject_id" value={subject_id} />}
              {topic_id && <input type="hidden" name="topic_id" value={topic_id} />}
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  name="search"
                  defaultValue={search || ''}
                  placeholder="Search questions by keyword..." 
                  className="w-full bg-[#0B0F19] text-white pl-10 pr-4 py-2 rounded-l-lg border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-r-lg font-medium hover:bg-purple-700 transition-colors">
                Search
              </button>
            </form>
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 font-medium transition-colors">
              <Filter size={18} /> Filters
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-[#111624] rounded-xl border border-white/10 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Question Preview</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Taxonomy</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Meta</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {questions && questions.length > 0 ? (
                  questions.map((q: any) => (
                    <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-sm font-bold text-purple-400">#{q.id}</td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300 line-clamp-2 max-w-md prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        <div className="font-bold text-white">{q.exam_name}</div>
                        <div className="text-xs mt-0.5">{q.subject_name} &rarr; {q.topic_name}</div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase ${q.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                            {q.status}
                          </span>
                          <span className="inline-block px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs font-bold">
                            {q.difficulty} • {q.question_type}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end h-full">
                        <Link href={`/admin/questions/${q.id}/edit`} className="inline-flex text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded transition-colors">
                          <Edit size={18} />
                        </Link>
                        <form action={deleteQuestion} className="inline-block ml-1">
                          <input type="hidden" name="id" value={q.id} />
                          <button type="submit" className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      No questions found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
