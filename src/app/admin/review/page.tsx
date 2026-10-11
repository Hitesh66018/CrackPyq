import { supabase } from "@/lib/supabase";
import { CheckSquare, Check, X, Eye } from "lucide-react";
import { revalidatePath } from "next/cache";
import MathText from "@/components/MathText";
import { db } from '@/utils/db';

export const instant = false;

// Inline server actions to handle approval and rejection using pg to bypass RLS
async function approveQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  await pool.query("UPDATE questions SET status = 'PUBLISHED' WHERE id = $1", [id]);
  revalidatePath("/admin/review");
}

async function rejectQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const pool = db;
  // Delete the question and cascade will handle options if foreign key is setup, 
  // but let's just delete options first to be safe, then the question.
  await pool.query("DELETE FROM options WHERE question_id = $1", [id]);
  await pool.query("DELETE FROM questions WHERE id = $1", [id]);
  revalidatePath("/admin/review");
}

async function approveAll() {
  "use server";
  const pool = db;
  await pool.query("UPDATE questions SET status = 'PUBLISHED' WHERE status = 'PENDING_REVIEW'");
  revalidatePath("/admin/review");
}

async function rejectAll() {
  "use server";
  const pool = db;
  // Delete all options for pending questions, then the questions themselves
  await pool.query("DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE status = 'PENDING_REVIEW')");
  await pool.query("DELETE FROM questions WHERE status = 'PENDING_REVIEW'");
  revalidatePath("/admin/review");
}

export default async function ReviewQueuePage() {
  const pool = db;
  
  const result = await pool.query(`
    SELECT 
      q.id, q.question_text, q.status,
      t.name as topic_name,
      s.name as subject_name,
      e.name as exam_name,
      COALESCE(
        json_agg(
          json_build_object('id', o.id, 'option_text', o.option_text, 'is_correct', o.is_correct)
        ) FILTER (WHERE o.id IS NOT NULL), '[]'
      ) as options
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN exams e ON s.exam_id = e.id
    LEFT JOIN options o ON q.id = o.question_id
    WHERE q.status = 'PENDING_REVIEW'
    GROUP BY q.id, t.name, s.name, e.name
    ORDER BY q.id ASC
  `);
  
  const questions = result.rows.map(row => ({
    id: row.id,
    question_text: row.question_text,
    status: row.status,
    options: row.options,
    topic: {
      name: row.topic_name,
      subject: {
        name: row.subject_name,
        exam: { name: row.exam_name }
      }
    }
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Queue</h2>
          <p className="text-gray-500">Verify imported or drafted questions before they go live.</p>
        </div>
        
        {questions && questions.length > 0 && (
          <div className="flex items-center gap-3">
            <form action={rejectAll}>
              <button type="submit" className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 flex items-center gap-2">
                <X size={18} /> Reject All
              </button>
            </form>
            <form action={approveAll}>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2">
                <CheckSquare size={18} /> Approve All
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {questions && questions.length > 0 ? (
          questions.map((q: any) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Needs Review
                  </span>
                  <span className="text-sm text-gray-500">
                    ID: #{q.id} • {q.topic?.subject?.exam?.name} &rarr; {q.topic?.name}
                  </span>
                </div>
                <div className="text-gray-900 font-medium text-lg mb-4"><MathText content={q.question_text} /></div>
                
                <div className="space-y-2 mt-4 border-t pt-4">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Options:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt: any, idx: number) => (
                      <div 
                        key={opt.id} 
                        className={`p-3 rounded-lg border text-sm ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                      >
                        <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
                        <MathText content={opt.option_text} />
                        {opt.is_correct && <Check size={16} className="inline ml-2 text-green-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-6 flex md:flex-col justify-center gap-3 w-full md:w-64">
                <form action={approveQuestion} className="flex-1 md:flex-none">
                  <input type="hidden" name="id" value={q.id} />
                  <button type="submit" className="w-full bg-green-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                    <Check size={20} /> Approve
                  </button>
                </form>
                <form action={rejectQuestion} className="flex-1 md:flex-none">
                  <input type="hidden" name="id" value={q.id} />
                  <button type="submit" className="w-full bg-white border border-red-200 text-red-600 font-bold px-4 py-3 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 transition-colors">
                    <X size={20} /> Reject
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="mx-auto bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckSquare className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Queue is Empty!</h3>
            <p className="text-gray-500">All questions have been reviewed and published. Great job.</p>
          </div>
        )}
      </div>
    </div>
  );
}
