import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, ArrowRight, BookOpen } from 'lucide-react'
import { db } from '@/utils/db';

export const instant = false;

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    const res = await pool.query(`
      SELECT q.id, q.question_text, q.question_type, t.name as topic_name, b.created_at
      FROM bookmarks b
      JOIN questions q ON b.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [user.id]);

    const bookmarks = res.rows;

    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bookmark className="text-purple-400" size={32} />
            My Bookmarks
          </h1>
          <p className="text-gray-400 mt-2">Questions you've saved for quick revision.</p>
        </header>

        {bookmarks.length === 0 ? (
          <div className="bg-[#111624] border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="text-purple-400" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No bookmarks yet</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">When you review your test results, you can bookmark tricky questions and they will appear here for easy revision.</p>
            <Link href="/dashboard" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookmarks.map(b => (
              <div key={b.id} className="bg-[#111624] rounded-2xl border border-white/10 p-6 flex flex-col transition-all hover:border-purple-500/30">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-white/5 text-purple-300 text-xs font-bold uppercase tracking-wider rounded">
                    {b.topic_name || 'Uncategorized'}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="text-gray-300 text-sm line-clamp-4 prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: b.question_text }} />
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {b.question_type} Question
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } finally {
    
  }
}
