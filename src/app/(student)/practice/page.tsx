import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, FileText, ArrowLeft, PlayCircle, Target } from 'lucide-react'
import { db } from '@/utils/db';

export const instant = false;

export default async function PracticeHubPage({ searchParams }: { searchParams: Promise<{ exam_id?: string }> }) {
  const { exam_id } = await searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  if (!exam_id) {
    // If no exam_id provided, show a list of available exams or redirect
    return redirect('/dashboard')
  }

  // DB Connection
  const pool = db;
  
  // Fetch exam details
  const examRes = await pool.query("SELECT * FROM exams WHERE id = $1", [exam_id]);
  if (examRes.rows.length === 0) return redirect('/dashboard');
  const exam = examRes.rows[0];

  // Fetch tests for this exam
  const testsRes = await pool.query(`
    SELECT t.*, 
      (SELECT count(*) FROM test_questions tq WHERE tq.test_id = t.id) as question_count,
      (SELECT status FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = $1 ORDER BY start_time DESC LIMIT 1) as latest_attempt_status,
      (SELECT id FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = $1 ORDER BY start_time DESC LIMIT 1) as latest_attempt_id
    FROM tests t 
    WHERE t.exam_id = $2 AND t.status = 'PUBLISHED'
    ORDER BY t.created_at DESC
  `, [user.id, exam_id]);
  
  const tests = testsRes.rows;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{exam.name} Practice Hub</h1>
          <p className="text-gray-400 mt-1">Select a mock test or previous year paper to begin.</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="bg-[#111624] p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white">No Tests Available Yet</h2>
          <p className="text-gray-400 mt-2 max-w-md">Our team is currently preparing the high-quality question bank for {exam.name}. Please check back later!</p>
          <Link href="/dashboard" className="mt-6 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => {
            const isResumable = test.latest_attempt_status === 'IN_PROGRESS';
            const isCompleted = test.latest_attempt_status === 'COMPLETED' || test.latest_attempt_status === 'SUBMITTED';

            return (
              <div key={test.id} className="bg-[#111624] p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col h-full hover:border-purple-500/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  {isResumable && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20 uppercase tracking-wider">
                      In Progress
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      Completed
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white">{test.title}</h3>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} /> {test.duration_minutes || 180} mins
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target size={16} /> {test.question_count || 65} Qs
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {isResumable ? (
                    <Link href={`/practice/engine/${test.latest_attempt_id}`} className="w-full py-2.5 bg-amber-600/90 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <PlayCircle size={18} /> Resume Test
                    </Link>
                  ) : isCompleted ? (
                    <div className="flex gap-2">
                      <Link href={`/practice/engine/init?test_id=${test.id}`} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                        Retake
                      </Link>
                      <Link href={`/analytics/result/${test.latest_attempt_id}`} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                        View Results
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/practice/engine/init?test_id=${test.id}`} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <PlayCircle size={18} /> Start Test
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
