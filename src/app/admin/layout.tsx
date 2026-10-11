import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Settings, Database, FileText, CheckSquare, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0B0F19] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111624] border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center">
            <img src="/crackpyq-logo.png" alt="CrackPYQ" className="h-7 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-300 bg-purple-600/20 text-purple-400 rounded-lg font-medium">
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Content Management
            </div>
            <Link href="/admin/exams" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <BookOpen size={20} /> Exams & Syllabus
            </Link>
            <Link href="/admin/questions" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Database size={20} /> Question Bank
            </Link>
            <Link href="/admin/tests" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <BookOpen size={20} /> Mock Tests
            </Link>
            <Link href="/admin/review" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <CheckSquare size={20} /> Review Queue
            </Link>

            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Platform
            </div>
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Users size={20} /> Users & Roles
            </Link>
            <Link href="/admin/cms" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <FileText size={20} /> Website Pages
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-[#0B0F19] hover:text-white rounded-lg font-medium transition-colors">
              <Settings size={20} /> Settings
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/30 rounded-lg font-medium transition-colors w-full">
            <LogOut size={20} /> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#111624] border-b border-white/10 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-white">Admin Control Center</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">Logged in as Super Admin</span>
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
