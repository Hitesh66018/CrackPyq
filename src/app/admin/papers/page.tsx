import Link from "next/link";
import { FileText, CheckCircle2, AlertCircle, Clock, Trash2, FolderOpen } from "lucide-react";
import { revalidatePath } from "next/cache";
import { db } from '@/utils/db';

export const instant = false;

async function deletePaper(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  
  await pool.query("DELETE FROM paper_questions WHERE source_paper_id = $1", [id]);
  await pool.query("DELETE FROM import_jobs WHERE source_paper_id = $1", [id]);
  await pool.query("DELETE FROM source_papers WHERE id = $1", [id]);
  revalidatePath("/admin/papers");
}

export default async function SourcePapersPage({
  searchParams,
}: {
  searchParams: Promise<{ exam_id?: string }>
}) {
  const resolvedParams = await searchParams;
  const pool = db;

  const examsRes = await pool.query("SELECT id, name FROM exams ORDER BY name");
  const exams = examsRes.rows;
  
  const activeExamId = resolvedParams.exam_id || (exams.length > 0 ? exams[0].id.toString() : "");

  let query = `
    SELECT sp.*, e.name as exam_name,
           (SELECT COUNT(*) FROM paper_questions pq WHERE pq.source_paper_id = sp.id) as exact_question_count
    FROM source_papers sp
    LEFT JOIN exams e ON sp.exam_id = e.id
  `;
  const params: any[] = [];
  
  if (activeExamId) {
    query += ` WHERE sp.exam_id = $1 `;
    params.push(activeExamId);
  }
  
  query += ` ORDER BY sp.id DESC`;

  const result = await pool.query(query, params);
  const papers = result.rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Source Papers</h2>
          <p className="text-gray-500">Upload and manage PDFs exam-wise.</p>
        </div>
        <Link 
          href={"/admin/questions/import-pdf?exam_id=" + activeExamId}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <FileText size={20} /> Upload PDF for Exam
        </Link>
      </div>
      
      {/* Exam Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 pb-px gap-6">
        {exams.map((exam: any) => {
          const isActive = activeExamId == exam.id.toString();
          return (
            <Link
              key={exam.id}
              href={"/admin/papers?exam_id=" + exam.id}
              className={"whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors " + (
                isActive
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {exam.name}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID / Title</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Questions Extracted</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {papers && papers.length > 0 ? (
                papers.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{p.paper_title}</div>
                      <div className="text-xs text-gray-500">#{p.id} - {new Date(p.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {p.exam_name || "Uncategorized"}
                    </td>
                    <td className="p-4 text-sm">
                      {p.status === 'IMPORTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">
                          <CheckCircle2 size={14} /> Imported
                        </span>
                      ) : p.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium text-xs">
                          <AlertCircle size={14} /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium text-xs">
                          <Clock size={14} /> Processing
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-900">
                      {p.exact_question_count}
                    </td>
                    <td className="p-4 text-right">
                      <form action={deletePaper} className="inline-block">
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-gray-400 hover:text-red-600 p-1" title="Delete Paper">
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderOpen size={32} className="text-gray-300" />
                      <p>No source papers uploaded for this exam yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
