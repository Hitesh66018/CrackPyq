import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Activity, Target, CheckCircle2 } from 'lucide-react'
import { db } from '@/utils/db';

export const instant = false;

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    const attemptsRes = await pool.query("SELECT * FROM test_attempts WHERE user_id = $1 AND status = 'SUBMITTED'", [user.id]);
    const attempts = attemptsRes.rows;

    const totalTests = attempts.length;
    let avgScore = 0;
    
    if (totalTests > 0) {
      const sum = attempts.reduce((acc, curr) => acc + Number(curr.total_score), 0);
      avgScore = sum / totalTests;
    }

    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-gray-400 mt-1">Macro insights into your exam preparation.</p>
        </header>

        {totalTests === 0 ? (
          <div className="bg-[#111624] p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center">
            <BarChart2 size={48} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-white">Not Enough Data</h2>
            <p className="text-gray-400 mt-2 max-w-md">Submit at least one mock test to generate your performance analytics report.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111624] p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-purple-400 mb-2">
                <Target size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">Tests Completed</span>
              </div>
              <div className="text-4xl font-bold text-white mt-4">{totalTests}</div>
            </div>

            <div className="bg-[#111624] p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <Activity size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">Average Score</span>
              </div>
              <div className="text-4xl font-bold text-white mt-4">{avgScore.toFixed(2)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-2xl border border-purple-500/30 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-white mb-2">Keep Practicing!</h3>
              <p className="text-purple-200 text-sm">More detailed subject-wise insights will unlock as you complete more tests.</p>
            </div>
          </div>
        )}
      </div>
    )
  } finally {
    
  }
}
