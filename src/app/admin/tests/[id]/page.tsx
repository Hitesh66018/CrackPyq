export const instant = false;

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, Trash2, BookOpen } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import TestBuilderClient from './TestBuilderClient'
import { db } from '@/utils/db';


export default async function TestBuilderPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ q?: string, subject_id?: string, topic_id?: string }>
}) {
  const { id } = await params;
  const { q, subject_id, topic_id } = await searchParams;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    // 1. Fetch test
    const testRes = await pool.query(`
      SELECT t.*, e.name as exam_name 
      FROM tests t 
      LEFT JOIN exams e ON t.exam_id = e.id 
      WHERE t.id = $1
    `, [id]);
    
    if (testRes.rows.length === 0) return <div className="p-8 text-white">Test not found</div>;
    const test = testRes.rows[0];

    // 2. Fetch Subjects and Topics for the dropdowns
    const subjectsRes = await pool.query("SELECT id, name FROM subjects ORDER BY name");
    const topicsRes = await pool.query("SELECT id, name, subject_id FROM topics ORDER BY name");

    // 3. Fetch questions ALREADY in the test
    const testQuestionsRes = await pool.query(`
      SELECT tq.order_num, q.id, q.question_text, t.name as topic_name
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE tq.test_id = $1
      ORDER BY tq.order_num ASC
    `, [id]);
    const testQuestions = testQuestionsRes.rows;
    const attachedIds = testQuestions.map(tq => tq.id);

    // 4. Fetch Available Questions (with filtering)
    let queryArgs: any[] = [];
    let queryStr = `
      SELECT q.id, q.question_text, t.name as topic_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE q.status = 'PUBLISHED'
    `;

    let argIdx = 1;
    if (q) {
      queryStr += ` AND q.question_text ILIKE $${argIdx}`;
      queryArgs.push(`%${q}%`);
      argIdx++;
    }
    
    if (topic_id) {
      queryStr += ` AND q.topic_id = $${argIdx}`;
      queryArgs.push(topic_id);
      argIdx++;
    } else if (subject_id) {
      // Need to join topics to check subject
      queryStr += ` AND t.subject_id = $${argIdx}`;
      queryArgs.push(subject_id);
      argIdx++;
    }

    if (attachedIds.length > 0) {
      queryStr += ` AND q.id != ALL($${argIdx}::int[])`;
      queryArgs.push(attachedIds);
    }

    queryStr += ` LIMIT 50`;

    const availableRes = await pool.query(queryStr, queryArgs);
    const availableQuestions = availableRes.rows;

    // --- Server Actions ---
    async function addQuestion(formData: FormData) {
      "use server"
      const question_id = formData.get('question_id');
      const test_id = formData.get('test_id');
      
      const { Pool } = require('pg');
      const p = new Pool({ connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" });
      
      const maxRes = await p.query("SELECT COALESCE(MAX(order_num), 0) as max_order FROM test_questions WHERE test_id = $1", [test_id]);
      const nextOrder = parseInt(maxRes.rows[0].max_order) + 1;
      
      await p.query("INSERT INTO test_questions (test_id, question_id, order_num) VALUES ($1, $2, $3)", [test_id, question_id, nextOrder]);
      p.end();
      revalidatePath(`/admin/tests/${test_id}`);
    }

    async function removeQuestion(formData: FormData) {
      "use server"
      const question_id = formData.get('question_id');
      const test_id = formData.get('test_id');
      
      const { Pool } = require('pg');
      const p = new Pool({ connectionString: "postgresql://postgres.sengtbtnzvilfdsxcafi:Hitesh123%402580%2321%2322%2323%2324%2325@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" });
      
      await p.query("DELETE FROM test_questions WHERE test_id = $1 AND question_id = $2", [test_id, question_id]);
      p.end();
      revalidatePath(`/admin/tests/${test_id}`);
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/tests" className="text-gray-400 hover:text-white bg-[#111624] p-2 border border-white/10 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Test Builder: {test.title}</h2>
            <p className="text-gray-400">{test.exam_name} - {test.duration_minutes} minutes</p>
          </div>
        </div>

        <TestBuilderClient subjects={subjectsRes.rows} topics={topicsRes.rows} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Questions IN the test */}
          <div className="bg-[#111624] rounded-xl border border-white/10 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0B0F19]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Check className="text-emerald-500" size={20} /> 
                Current Test Questions ({testQuestions.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {testQuestions.length > 0 ? (
                testQuestions.map(tq => (
                  <div key={tq.id} className="border border-white/10 rounded-lg p-4 bg-[#0B0F19] flex gap-4 hover:border-white/20 transition-colors">
                    <div className="text-purple-400 font-bold bg-purple-500/10 h-8 w-8 rounded flex items-center justify-center shrink-0">{tq.order_num}</div>
                    <div className="flex-1">
                      <div dangerouslySetInnerHTML={{ __html: tq.question_text }} className="text-sm text-gray-200 line-clamp-3 mb-2 prose prose-sm prose-invert" />
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{tq.topic_name || "Uncategorized"}</span>
                    </div>
                    <form action={removeQuestion}>
                      <input type="hidden" name="test_id" value={test.id} />
                      <input type="hidden" name="question_id" value={tq.id} />
                      <button type="submit" className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                  <p>No questions added to this test yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Available Question Bank */}
          <div className="bg-[#111624] rounded-xl border border-white/10 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0B0F19] flex justify-between items-center">
              <h3 className="font-bold text-white">Question Bank Search Results</h3>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{availableQuestions.length} {availableQuestions.length === 50 ? 'limit reached' : 'found'}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {availableQuestions.length > 0 ? (
                availableQuestions.map(q => (
                  <div key={q.id} className="border border-white/10 rounded-lg p-4 flex gap-4 items-start hover:border-purple-500/50 transition-colors bg-[#0B0F19]">
                    <div className="flex-1">
                      <div dangerouslySetInnerHTML={{ __html: q.question_text }} className="text-sm text-gray-200 line-clamp-3 mb-2 prose prose-sm prose-invert" />
                      <div className="flex gap-2">
                        <span className="text-xs font-mono text-gray-500">#{q.id}</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{q.topic_name || "Uncategorized"}</span>
                      </div>
                    </div>
                    <form action={addQuestion}>
                      <input type="hidden" name="test_id" value={test.id} />
                      <input type="hidden" name="question_id" value={q.id} />
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
                        <Plus size={16} /> Add
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No questions match your search filters.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  } finally {
    
  }
}
