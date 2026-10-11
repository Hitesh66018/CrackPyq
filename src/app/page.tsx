import Link from "next/link";
import { 
  CheckCircle2, 
  Users, 
  FileText, 
  Award, 
  Star,
  Monitor,
  Brain,
  Library,
  BarChart3,
  Rocket,
  Search,
  Settings,
  Atom,
  BookOpen,
  Stethoscope,
  Building2,
  Building
} from "lucide-react";

export const instant = false;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden font-sans">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-[0%] left-[0%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[0%] w-[40%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="w-full relative z-50 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-lg flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
               <img src="/crackpyq-logo.png" alt="CrackPYQ" className="h-6 w-auto object-contain" />
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="/" className="text-white border-b-2 border-purple-500 pb-1">Home</Link>
            <Link href="#exams" className="hover:text-white transition-colors">Exams</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#reviews" className="hover:text-white transition-colors">Reviews</Link>
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">
              <Search size={18} />
            </button>
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white px-4 py-2 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium">
                <Rocket size={14} /> CrackPYQ Version 1.0 is Live
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Master Your Exams<br />
                with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Real PYQs</span>
              </h1>
              
              <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                The ultimate platform to practice Previous Year Questions, take mock tests, get detailed solutions and track your progress for GATE, JEE, NEET, SSC and more.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-300">
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> 20+ Years of PYQs</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Chapter-wise Practice</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Detailed Solutions</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Mock Tests</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Progress Tracking</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> AI-Powered Analytics</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/signup" className="inline-flex justify-center items-center gap-2 text-white bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                  Start Practicing Free &rarr;
                </Link>
                <Link href="#exams" className="inline-flex justify-center items-center px-8 py-3.5 rounded-xl font-semibold text-white border border-white/20 bg-[#111624] hover:bg-white/10 transition-colors">
                  Explore Exams
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0B0F19] overflow-hidden bg-gray-800">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Student" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">Trusted by <span className="text-white font-bold">50,000+</span> students</div>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs mt-0.5">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <span className="text-gray-400 ml-1">4.8/5 (2,000+ reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Illustration Placeholder */}
            <div className="relative hidden lg:block h-[500px] w-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-2xl blur-3xl"></div>
              <div className="absolute inset-0 bg-[#111624] border border-white/10 rounded-3xl p-2 shadow-2xl overflow-hidden flex flex-col">
                <div className="w-full h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#0B0F19]/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <div className="ml-4 text-xs font-medium text-gray-400 flex-1 text-center bg-white/5 rounded-md py-1">mock-test-engine.exe</div>
                </div>
                <div className="relative flex-1 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
                  <div className="absolute inset-0 bg-[#0B0F19]/80 backdrop-blur-[2px]"></div>
                  
                  {/* Mock UI Overlay */}
                  <div className="absolute top-8 left-8 right-16 bottom-16 bg-[#111624]/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="text-sm text-purple-300 font-bold bg-purple-500/20 px-3 py-1 rounded-md">GATE Computer Science</div>
                      <div className="text-xs text-gray-400 font-mono">Time Left: 45:12</div>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="text-sm font-medium text-gray-300 leading-relaxed">
                        Q1. Consider a graph with 5 vertices... Which of the following is true?
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="h-10 border border-white/10 rounded-lg flex items-center px-4 gap-3 bg-white/5 text-sm text-gray-400 hover:bg-white/10 transition-colors"><div className="w-4 h-4 rounded-full border border-gray-500"></div> Option A</div>
                        <div className="h-10 border border-purple-500/50 rounded-lg flex items-center px-4 gap-3 bg-purple-500/10 text-purple-200 text-sm font-medium"><div className="w-4 h-4 rounded-full border-4 border-purple-500"></div> Option B (Selected)</div>
                        <div className="h-10 border border-white/10 rounded-lg flex items-center px-4 gap-3 bg-white/5 text-sm text-gray-400 hover:bg-white/10 transition-colors"><div className="w-4 h-4 rounded-full border border-gray-500"></div> Option C</div>
                      </div>
                      <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium w-max shadow-[0_0_15px_rgba(147,51,234,0.3)]">Submit Answer</button>
                    </div>
                  </div>

                  {/* Analytics Widget Overlay */}
                  <div className="absolute right-4 top-20 bg-[#111624] border border-white/10 rounded-xl p-4 shadow-2xl w-48 z-10 hidden sm:block">
                     <div className="text-xs text-gray-400 mb-2">Your Progress</div>
                     <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center text-lg font-bold text-white mb-4">72%</div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-xs"><span className="text-gray-500">Solved</span><span className="text-white font-medium">1,250</span></div>
                       <div className="flex justify-between text-xs"><span className="text-gray-500">Mock Tests</span><span className="text-white font-medium">18</span></div>
                     </div>
                  </div>
                </div>
              </div>
              
              {/* Handwritten Floating text */}
              <div className="absolute -right-6 top-8 text-purple-300 font-serif text-lg rotate-12 drop-shadow-[0_0_10px_rgba(147,51,234,0.8)] hidden sm:block">
                Same Questions<br/>Brighter Future
                <svg className="w-8 h-8 absolute -bottom-6 right-8 text-purple-300 rotate-[120deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-[#0B0F19] via-[#111624] to-[#0B0F19] py-8 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-white/5">
            <div className="flex items-center justify-center gap-4 px-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Users size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">50,000+</div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <FileText size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">20+ Years</div>
                <div className="text-sm text-gray-400">PYQs & Questions</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Award size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">10+</div>
                <div className="text-sm text-gray-400">Major Exams</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <Star size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4.8/5</div>
                <div className="text-sm text-gray-400">Student Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exams We Cover */}
      <section id="exams" className="py-24 relative bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-6">
            All-in-One Exam Preparation Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Exams <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">We Cover</span></h2>
          <p className="text-gray-400 mb-16 text-lg max-w-2xl mx-auto">Get access to previous year questions, mock tests and detailed solutions for top competitive exams.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {/* Exam Cards */}
            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(147,51,234,0.15)] transition-transform hover:-translate-y-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Settings className="w-12 h-12 text-blue-400 mb-5 relative z-10" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">GATE</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1 relative z-10">Computer Science, Electrical, Mechanical and more</p>
              <div className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full relative z-10">PYQs • Mock Tests • Solutions</div>
            </div>

            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all hover:-translate-y-2 group">
              <Atom className="w-12 h-12 text-red-400 mb-5" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">JEE Main</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1">Physics, Chemistry, Mathematics</p>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full">PYQs • Mock Tests • Solutions</div>
            </div>

            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all hover:-translate-y-2 group">
              <BookOpen className="w-12 h-12 text-teal-400 mb-5" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">JEE Advanced</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1">Physics, Chemistry, Mathematics</p>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full">PYQs • Mock Tests • Solutions</div>
            </div>

            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all hover:-translate-y-2 group">
              <Stethoscope className="w-12 h-12 text-green-400 mb-5" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">NEET</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1">Biology, Physics, Chemistry</p>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full">PYQs • Mock Tests • Solutions</div>
            </div>

            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all hover:-translate-y-2 group">
              <Building2 className="w-12 h-12 text-blue-400 mb-5" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">SSC CGL</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1">Tier 1 & Tier 2 PYQs</p>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full">PYQs • Mock Tests • Solutions</div>
            </div>

            <div className="bg-gradient-to-b from-[#111624] to-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all hover:-translate-y-2 group">
              <Building className="w-12 h-12 text-emerald-400 mb-5" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">SSC CHSL</h3>
              <p className="text-xs text-gray-400 mb-6 flex-1">Tier 1 & Tier 2 PYQs</p>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold border-t border-white/10 pt-4 w-full">PYQs • Mock Tests • Solutions</div>
            </div>
          </div>

          <div className="absolute right-10 -bottom-10 text-blue-400 font-serif text-lg -rotate-12 hidden md:block">
            More Exams Coming Soon!
            <svg className="w-8 h-8 absolute -bottom-6 left-8 text-blue-400 rotate-[90deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-gradient-to-b from-[#0B0F19] to-[#111624]/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-4">
              Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Why choose <span className="text-blue-500">CrackPYQ?</span></h2>
            <p className="text-gray-400 text-lg">Built for speed, accuracy, and scaling to 20+ years of exams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111624] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-start gap-4 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Real Exam Interface</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Practice in an environment that perfectly mirrors the actual TCS iON or NTA exam portals.</p>
              </div>
            </div>
            
            <div className="bg-[#111624] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-start gap-4 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">AI-Powered Analytics</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Discover your weak topics instantly. Our AI clusters your mistakes and suggests targeted practice.</p>
              </div>
            </div>

            <div className="bg-[#111624] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-start gap-4 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Library size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Massive Question Bank</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Access 20+ years of deduplicated Previous Year Questions across GATE, JEE, NEET, SSC and more.</p>
              </div>
            </div>

            <div className="bg-[#111624] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-start gap-4 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Track Your Progress</h3>
                <p className="text-sm text-gray-400 leading-relaxed">Detailed performance analysis, chapter-wise insights and personalized improvement plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-white/5 bg-gradient-to-b from-[#111624]/50 to-[#0B0F19] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-6">
            Trusted by Top Rankers
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Real Students. <span className="text-purple-400">Real Results.</span></h2>
          <p className="text-gray-400 mb-16 text-lg">See how CrackPYQ is helping aspirants achieve their goals.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-[#111624] border border-white/5 rounded-2xl p-8 flex flex-col h-full shadow-xl">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
              </div>
              <p className="text-gray-300 mb-8 flex-1 leading-relaxed">"The real-time interface is exactly like the actual TCS iON portal. Practicing here completely removed my exam-day anxiety."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">A</div>
                <div>
                  <div className="text-white font-bold">Aman R.</div>
                  <div className="text-teal-400 text-sm">JEE Advanced AIR 412</div>
                </div>
              </div>
            </div>

            <div className="bg-[#111624] border border-white/5 rounded-2xl p-8 flex flex-col h-full shadow-xl">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
              </div>
              <p className="text-gray-300 mb-8 flex-1 leading-relaxed">"I used to waste hours finding chapter-wise PYQs from different PDFs. CrackPYQ has everything sorted with step-by-step solutions."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">P</div>
                <div>
                  <div className="text-white font-bold">Priya S.</div>
                  <div className="text-gray-400 text-sm">GATE CSE Topper</div>
                </div>
              </div>
            </div>

            <div className="bg-[#111624] border border-white/5 rounded-2xl p-8 flex flex-col h-full shadow-xl">
              <div className="flex items-center gap-1 text-yellow-400 mb-6">
                <Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" />
              </div>
              <p className="text-gray-300 mb-8 flex-1 leading-relaxed">"Finding genuine NEET PYQs without duplicates was a nightmare. The UI is clean, fast and works perfectly on my phone."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-teal-500/50 bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">V</div>
                <div>
                  <div className="text-white font-bold">Vikram K.</div>
                  <div className="text-teal-400 text-sm">NEET Aspirant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#111624] to-[#0B0F19] border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-blue-400 shrink-0">
                <Rocket size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Start Your Preparation Today</h2>
                <p className="text-gray-400 text-lg">Join thousands of aspirants and take a step closer to your dream.</p>
              </div>
            </div>
            <Link href="/signup" className="shrink-0 relative z-10 text-white bg-cyan-500 px-8 py-4 rounded-xl font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] text-lg">
              Create Your Free Account &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#070A12] pt-20 pb-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="bg-white px-3 py-1.5 rounded-lg inline-flex items-center mb-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                 <img src="/crackpyq-logo.png" alt="CrackPYQ" className="h-6 w-auto object-contain" />
              </div>
              <p className="text-gray-400 mb-6">Same Questions. Brighter Future.</p>
              <div className="flex gap-4 text-gray-400">
                <a href="#" className="hover:text-white transition-colors bg-white/5 p-2 rounded-lg border border-white/5"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
                <a href="#" className="hover:text-white transition-colors bg-white/5 p-2 rounded-lg border border-white/5"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                <a href="#" className="hover:text-white transition-colors bg-white/5 p-2 rounded-lg border border-white/5"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></a>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="text-white font-bold mb-6">Exams</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">GATE</a></li>
                <li><a href="#" className="hover:text-white transition-colors">JEE Main</a></li>
                <li><a href="#" className="hover:text-white transition-colors">JEE Advanced</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NEET</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSC CGL</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSC CHSL</a></li>
                <li><a href="#" className="hover:text-white transition-colors">More (Coming Soon)</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-white font-bold mb-6">Join Our Community</h4>
              <p className="text-sm text-gray-400 mb-6">Get updates, new exams and study tips directly to your inbox.</p>
              <form className="flex">
                <input type="email" placeholder="Enter your email" className="bg-[#111624] border border-white/10 rounded-l-xl px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-purple-500 transition-colors" />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 text-sm rounded-r-xl font-bold transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
            <div>© 2026 CrackPYQ. All rights reserved.</div>
            <div>Built with ❤️ by Hitesh Sharma</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
