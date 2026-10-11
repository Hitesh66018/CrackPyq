import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal, Award, Activity } from 'lucide-react'
import { db } from '@/utils/db';

export const instant = false;

export default async function LeaderboardPage({ params }: { params: Promise<{ test_id: string }> }) {
  const { test_id } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    // Fetch Test info
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [test_id]);
    if (testRes.rows.length === 0) return redirect('/dashboard');
    const test = testRes.rows[0];

    // Fetch Leaderboard Data
    // We only rank SUBMITTED attempts. If a user took it multiple times, we use their MAX score.
    const ranksRes = await pool.query(`
      WITH RankedAttempts AS (
        SELECT 
          ta.user_id, 
          MAX(ta.total_score) as max_score,
          MIN(ta.end_time - ta.created_at) as best_time
        FROM test_attempts ta
        WHERE ta.test_id = $1 AND ta.status = 'SUBMITTED'
        GROUP BY ta.user_id
      )
      SELECT 
        ra.*,
        RANK() OVER (ORDER BY max_score DESC, best_time ASC) as rank_position
      FROM RankedAttempts ra
      ORDER BY rank_position ASC
      LIMIT 100
    `, [test.id]);
    
    const ranks = ranksRes.rows;
    
    // Find current user's rank
    const myRank = ranks.find(r => r.user_id === user.id);

    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} /> 
              Cohort Leaderboard
            </h1>
            <p className="text-gray-400 mt-1">{test.title} • Top 100 Students</p>
          </div>
        </div>

        {/* Current User Stats */}
        {myRank && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center font-bold text-2xl text-purple-400 border border-purple-500/50">
                #{myRank.rank_position}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Rank</h3>
                <p className="text-purple-300/80">Out of {ranks.length} participants</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Max Score</div>
                <div className="text-2xl font-bold text-white">{myRank.max_score}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Percentile</div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(((ranks.length - myRank.rank_position) / ranks.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-[#111624] rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center w-24">Rank</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student ID</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ranks.map((r, i) => {
                const isMe = r.user_id === user.id;
                
                let RankIcon = null;
                if (r.rank_position === "1") RankIcon = <Trophy className="text-yellow-400 mx-auto" size={24} />;
                else if (r.rank_position === "2") RankIcon = <Medal className="text-gray-300 mx-auto" size={24} />;
                else if (r.rank_position === "3") RankIcon = <Award className="text-amber-600 mx-auto" size={24} />;
                else RankIcon = <span className="font-bold text-gray-500">#{r.rank_position}</span>;

                return (
                  <tr key={r.user_id} className={`transition-colors ${isMe ? 'bg-purple-900/10' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-4 text-center">{RankIcon}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isMe ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                          {r.user_id.substring(0,2).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-300">
                          {isMe ? <span className="text-purple-400 font-bold">You</span> : `Student ${r.user_id.substring(0,8)}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white text-lg">{r.max_score}</span>
                    </td>
                  </tr>
                )
              })}
              
              {ranks.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-gray-500">
                    <Activity className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                    <p>No attempts have been submitted for this test yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    );
  } finally {
    
  }
}
