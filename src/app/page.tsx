import Link from "next/link";
import { BookOpen, Target, Brain, ArrowRight, BarChart3, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Brain size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">PYQMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          Now supporting GATE CSE & JEE Mains
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          Master your competitive exams with <span className="text-blue-600">Real Past Papers</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Practice with a real-time exam interface, get detailed step-by-step solutions, and identify your weak spots to boost your rank.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/exams" 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            Start Practicing Free <ArrowRight size={20} />
          </Link>
          <Link 
            href="#features" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            View Features
          </Link>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Real CBT Interface</h3>
            <p className="text-gray-600">
              Practice in an environment that simulates the actual Computer Based Test, complete with timers and marking schemes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Detailed Solutions</h3>
            <p className="text-gray-600">
              Stop guessing. Every question comes with a comprehensive step-by-step explanation from experts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Analytics</h3>
            <p className="text-gray-600">
              Identify your weakest topics instantly. Our dashboard breaks down your performance subject by subject.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>© 2026 PYQMaster. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link href="#" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-900">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
