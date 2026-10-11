import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Target, PlayCircle, Clock, Trophy, Activity, CheckCircle, ArrowRight } from 'lucide-react'
import { ProgressLineChart } from '@/components/analytics/ProgressLineChart'
import { db } from '@/utils/db';

export const instant = false;

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null;

  // DB Connection
  const pool = db;
  
  // 1. Fetch Metrics & Progress Data
  const attemptsRes = await pool.query(`
    SELECT ta.*, t.title as test_name
    FROM test_attempts ta
    JOIN tests t ON ta.test_id = t.id
    WHERE ta.user_id = $1
    ORDER BY ta.created_at ASC
  `, [user.id]);
  
  const allAttempts = attemptsRes.rows;
  const hasAttempts = allAttempts.length > 0;
  const completedAttempts = allAttempts.filter(a => a.status === 'SUBMITTED');
  const inProgressTests = allAttempts.filter(a => a.status === 'IN_PROGRESS');

  const testsAttempted = completedAttempts.length;

  const statsRes = await pool.query(`
    SELECT 
      COUNT(*) as questions_solved,
      COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers
    FROM attempt_details ad
    JOIN test_attempts ta ON ad.attempt_id = ta.id
    WHERE ta.user_id = $1 AND ta.status = 'SUBMITTED' AND 
    (ad.selected_option_id IS NOT NULL OR ad.selected_options_array IS NOT NULL OR ad.answer_text IS NOT NULL)
  `, [user.id]);
  
  const questionsSolved = parseInt(statsRes.rows[0].questions_solved) || 0;
  const correctAnswers = parseInt(statsRes.rows[0].correct_answers) || 0;
  const avgAccuracy = questionsSolved > 0 ? Math.round((correctAnswers / questionsSolved) * 100) : 0;
  const currentStreak = testsAttempted > 0 ? 1 : 0; // Simple streak for now

  // Fetch accuracy per attempt for the chart
  const accuraciesRes = await pool.query(`
    SELECT attempt_id, COUNT(*) as total_q, COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_q
    FROM attempt_details
    WHERE selected_option_id IS NOT NULL OR selected_options_array IS NOT NULL OR answer_text IS NOT NULL
    GROUP BY attempt_id
  `);
  const accMap: Record<string, { total: number, correct: number }> = {};
  accuraciesRes.rows.forEach(r => {
    accMap[r.attempt_id] = { total: parseInt(r.total_q), correct: parseInt(r.correct_q) };
  });

  const progressData = completedAttempts.map((attempt, index) => {
    const acc = accMap[attempt.id];
    return {
      name: attempt.test_name || `Test ${index + 1}`,
      score: Number(attempt.total_score) || 0,
      accuracy: acc && acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0
    };
  });

  // 3. Fetch Exams & check which ones have actual tests/questions
  const examsRes = await pool.query(`
    SELECT e.*, c.name as category_name,
      (SELECT count(*) FROM tests t WHERE t.exam_id = e.id) as test_count
    FROM exams e 
    LEFT JOIN categories c ON e.category_id = c.id 
    ORDER BY e.name
  `);
  
  const userName = user.email?.split('@')[0] || 'Student'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10">
      
      {/* SECTION A: Welcome & Quick Stats */}
      <section>
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-gray-400 mt-1">Here is a snapshot of your preparation progress.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111624] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-purple-400 mb-2">
              <Target size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Tests Attempted</span>
            </div>
            <div className="text-3xl font-bold text-white">{testsAttempted}</div>
            {!hasAttempts && <p className="text-xs text-gray-500 mt-2">Start your first test today!</p>}
          </div>

          <div className="bg-[#111624] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
              <CheckCircle size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Questions Solved</span>
            </div>
            <div className="text-3xl font-bold text-white">{questionsSolved}</div>
          </div>

          <div className="bg-[#111624] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <Activity size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Avg. Accuracy</span>
            </div>
            <div className="text-3xl font-bold text-white">{avgAccuracy}%</div>
          </div>

          <div className="bg-[#111624] p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-orange-400 mb-2">
              <Trophy size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">{currentStreak} <span className="text-lg text-gray-400 font-medium">days</span></div>
          </div>
        </div>
      </section>

      {/* SECTION A2: Global Progress Chart */}
      <section className="bg-[#111624] p-6 rounded-3xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={24} className="text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Performance Journey</h2>
        </div>
        <ProgressLineChart data={progressData} />
      </section>

      {/* SECTION B: Continue Where You Left Off */}
      {inProgressTests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Continue Practice</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressTests.map(test => (
              <div key={test.id} className="bg-purple-900/20 p-5 rounded-2xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{test.test_name}</h3>
                  <p className="text-sm text-purple-300 flex items-center gap-2 mt-1">
                    <Clock size={14} /> In Progress
                  </p>
                </div>
                <Link href={`/practice/engine/${test.id}`} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <PlayCircle size={18} /> Resume
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION C: Recommended Practice & Exam Availability */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Target Exams</h2>
          <Link href="/practice" className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
            View Practice Hub <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examsRes.rows.map((exam: any) => {
            const isAvailable = parseInt(exam.test_count) > 0 || exam.name.includes("GATE");
            
            return (
              <div key={exam.id} className={`p-6 rounded-2xl border transition-all ${isAvailable ? 'bg-[#111624] border-white/10 hover:border-purple-500/50 shadow-sm hover:shadow-md' : 'bg-[#0B0F19] border-white/5 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAvailable ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                    <Target size={24} />
                  </div>
                  {!isAvailable && (
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs font-semibold rounded-full border border-white/5">
                      Coming Soon
                    </span>
                  )}
                  {isAvailable && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
                      Available
                    </span>
                  )}
                </div>
                
                <h3 className={`text-xl font-bold ${isAvailable ? 'text-white' : 'text-gray-400'}`}>{exam.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6 line-clamp-2">
                  {exam.description || `Comprehensive mock tests and previous year questions for ${exam.name}.`}
                </p>
                
                <Link 
                  href={isAvailable ? `/practice?exam_id=${exam.id}` : '#'}
                  className={`block w-full text-center py-2.5 rounded-lg font-medium transition-colors ${
                    isAvailable 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? 'Explore Tests' : 'Notify Me'}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
