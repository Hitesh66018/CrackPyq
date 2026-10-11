import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, CheckCircle2, PlayCircle, BarChart2 } from 'lucide-react'
import { db } from '@/utils/db';

export const instant = false;

export default async function TestHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    const historyRes = await pool.query(`
      SELECT ta.id, ta.status, ta.total_score, ta.created_at, ta.start_time, ta.end_time,
             t.title as test_title, e.name as exam_name
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN exams e ON ta.exam_id = e.id
      WHERE ta.user_id = $1
      ORDER BY ta.created_at DESC
    `, [user.id]);
    
    const attempts = historyRes.rows;

    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Test History</h1>
          <p className="text-gray-400 mt-1">Review your past performance and resume incomplete tests.</p>
        </header>

        {attempts.length === 0 ? (
          <div className="bg-[#111624] p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center">
            <Clock size={48} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-white">No Test History</h2>
            <p className="text-gray-400 mt-2 max-w-md">You haven't attempted any tests yet. Head over to the Practice Hub to start your first mock test!</p>
            <Link href="/practice" className="mt-6 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
              Explore Practice Hub
            </Link>
          </div>
        ) : (
          <div className="bg-[#111624] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Test Name</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Started</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attempts.map(attempt => {
                    const isInProgress = attempt.status === 'IN_PROGRESS';
                    
                    return (
                      <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{attempt.test_title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{attempt.exam_name}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          {new Date(attempt.start_time).toLocaleDateString()}
                          <div className="text-xs text-gray-500 mt-0.5">{new Date(attempt.start_time).toLocaleTimeString()}</div>
                        </td>
                        <td className="p-4">
                          {isInProgress ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                              <Clock size={14} /> IN PROGRESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                              <CheckCircle2 size={14} /> SUBMITTED
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isInProgress ? (
                            <span className="text-gray-500 text-sm italic">Pending</span>
                          ) : (
                            <span className="font-bold text-white text-lg">{Number(attempt.total_score).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isInProgress ? (
                            <Link href={`/practice/engine/${attempt.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                              <PlayCircle size={16} /> Resume
                            </Link>
                          ) : (
                            <Link href={`/analytics/result/${attempt.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors">
                              <BarChart2 size={16} /> View Result
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  } finally {
    
  }
}
