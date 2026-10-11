import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Clock, BarChart2, Bookmark, Settings, LogOut, Bell, Search } from 'lucide-react'
import { db } from '@/utils/db';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch user role
  const pool = db;
  
  const res = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [user.id]);
  let role = 'STUDENT';
  if (res.rows.length > 0) role = res.rows[0].role;
  
  // If admin tries to access student dashboard, maybe redirect them, but for now we allow it or redirect
  if (role === 'SUPER_ADMIN' || role === 'CONTENT_ADMIN') {
    return redirect('/admin')
  }

  // Get user profile details (assuming email for now if no profile table)
  const userName = user.email?.split('@')[0] || 'Student'
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#111624] border-r border-white/10 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <img src="/crackpyq-logo.png" alt="CrackPYQ" className="h-7 w-auto object-contain" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Menu</div>
            
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-purple-400 bg-purple-600/20 rounded-lg font-medium transition-colors">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link href="/practice" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <BookOpen size={20} /> Practice Hub
            </Link>
            <Link href="/history" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Clock size={20} /> Test History
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <BarChart2 size={20} /> Analytics
            </Link>
            <Link href="/bookmarks" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Bookmark size={20} /> Bookmarks
            </Link>
          </nav>
          
          <nav className="space-y-1 px-3 mt-8">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Account</div>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Settings size={20} /> Settings
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10 shrink-0">
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg font-medium transition-colors w-full text-left">
              <LogOut size={20} /> Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-[#111624]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex-1 flex items-center">
            {/* Mobile Menu Button - could add later */}
            <div className="w-full max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search PYQs, exams, or topics..." 
                className="w-full bg-[#0B0F19] text-white pl-10 pr-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </button>
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20">
              {initial}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
