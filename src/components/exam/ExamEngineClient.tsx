'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Bookmark, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ExamEngineClient({ attempt, test, questions, savedResponses }: any) {
  const router = useRouter();
  const [activeQ, setActiveQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Time tracking per question
  const questionTimeRef = useRef<number>(0);

  // Initialize responses from DB
  useEffect(() => {
    const initial: Record<number, any> = {};
    questions.forEach((q: any) => {
      const saved = savedResponses.find((r: any) => r.question_id === q.id);
      if (saved) {
        initial[q.id] = {
          selected_option_id: saved.selected_option_id,
          selected_options_array: saved.selected_options_array || [],
          answer_text: saved.answer_text || '',
          status: saved.status,
          is_marked_for_review: saved.is_marked_for_review
        };
      } else {
        initial[q.id] = { status: 'NOT_VISITED', is_marked_for_review: false, selected_options_array: [], answer_text: '' };
      }
    });
    // Mark first question as visited if not visited
    if (questions.length > 0 && initial[questions[0].id].status === 'NOT_VISITED') {
      initial[questions[0].id].status = 'NOT_ANSWERED';
    }
    setResponses(initial);
  }, []);

  // Server-authoritative Countdown Timer
  useEffect(() => {
    const deadline = new Date(attempt.deadline).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.floor((deadline - now) / 1000);
      
      // Increment time spent on current question
      questionTimeRef.current += 1;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        submitTest(); // Auto-submit when time is up
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [attempt.deadline]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionId: number) => {
    const qId = questions[activeQ].id;
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_id: optionId }
    }));
  };

  const handleMsqToggle = (optionId: number) => {
    const qId = questions[activeQ].id;
    setResponses(prev => {
      const currentArr = prev[qId].selected_options_array || [];
      const newArr = currentArr.includes(optionId) 
        ? currentArr.filter((id: number) => id !== optionId)
        : [...currentArr, optionId];
      return { ...prev, [qId]: { ...prev[qId], selected_options_array: newArr } };
    });
  };

  const handleNatChange = (val: string) => {
    const qId = questions[activeQ].id;
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], answer_text: val }
    }));
  };

  const saveToDb = async (qId: number, data: any, timeSpent: number = 0) => {
    setSaving(true);
    try {
      await fetch('/api/practice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          question_id: qId,
          time_spent_seconds: timeSpent,
          ...data
        })
      });
    } catch (e) {
      toast.error("Failed to save response. Please check connection.");
    } finally {
      setSaving(false);
    }
  };

  const navigateToQuestion = (newIndex: number) => {
    const oldQId = questions[activeQ].id;
    const oldState = responses[oldQId];
    
    // Save time spent on the old question
    saveToDb(oldQId, oldState, questionTimeRef.current);
    questionTimeRef.current = 0;

    const nextQId = questions[newIndex].id;
    setResponses(prev => {
      const nextState = { ...prev };
      if (nextState[nextQId].status === 'NOT_VISITED') {
        nextState[nextQId].status = 'NOT_ANSWERED';
        saveToDb(nextQId, nextState[nextQId], 0);
      }
      return nextState;
    });
    setActiveQ(newIndex);
  };

  const goToNext = () => {
    if (activeQ < questions.length - 1) {
      navigateToQuestion(activeQ + 1);
    }
  };

  const isAnswered = (response: any) => {
    return response.selected_option_id || 
           (response.selected_options_array && response.selected_options_array.length > 0) || 
           (response.answer_text && response.answer_text.trim() !== '');
  };

  const handleSaveAndNext = () => {
    const qId = questions[activeQ].id;
    setResponses(prev => {
      const current = prev[qId];
      const status = isAnswered(current) ? 'ANSWERED' : 'NOT_ANSWERED';
      return { ...prev, [qId]: { ...current, status, is_marked_for_review: false } };
    });
    // State update is async, so navigateToQuestion will capture old state if we call it immediately?
    // Actually, we can just do the logic synchronously and call save directly, then navigate!
    
    // Better: update state, save time, then switch.
    const current = responses[qId];
    const status = isAnswered(current) ? 'ANSWERED' : 'NOT_ANSWERED';
    const newState = { ...current, status, is_marked_for_review: false };
    
    setResponses(prev => ({ ...prev, [qId]: newState }));
    saveToDb(qId, newState, questionTimeRef.current);
    questionTimeRef.current = 0; // reset
    
    if (activeQ < questions.length - 1) {
      const nextQId = questions[activeQ + 1].id;
      setResponses(prev => {
        const nextState = { ...prev };
        if (nextState[nextQId]?.status === 'NOT_VISITED') {
          nextState[nextQId].status = 'NOT_ANSWERED';
          saveToDb(nextQId, nextState[nextQId], 0);
        }
        return nextState;
      });
      setActiveQ(activeQ + 1);
    }
  };

  const handleMarkForReview = () => {
    const qId = questions[activeQ].id;
    const current = responses[qId];
    const status = isAnswered(current) ? 'ANSWERED' : 'NOT_ANSWERED';
    const newState = { ...current, status, is_marked_for_review: true };
    
    setResponses(prev => ({ ...prev, [qId]: newState }));
    saveToDb(qId, newState, questionTimeRef.current);
    questionTimeRef.current = 0;
    
    if (activeQ < questions.length - 1) {
      const nextQId = questions[activeQ + 1].id;
      setResponses(prev => {
        const nextState = { ...prev };
        if (nextState[nextQId]?.status === 'NOT_VISITED') {
          nextState[nextQId].status = 'NOT_ANSWERED';
          saveToDb(nextQId, nextState[nextQId], 0);
        }
        return nextState;
      });
      setActiveQ(activeQ + 1);
    }
  };

  const handleClearResponse = () => {
    const qId = questions[activeQ].id;
    const newState = { selected_option_id: null, selected_options_array: [], answer_text: '', status: 'NOT_ANSWERED', is_marked_for_review: false };
    setResponses(prev => ({ ...prev, [qId]: newState }));
    // We do NOT navigate here, just clear and save time=0 (don't flush time yet)
    saveToDb(qId, newState, 0);
  };

  const submitTest = async () => {
    try {
      toast.loading("Submitting test...", { id: 'submit' });
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attempt.id })
      });
      if (res.ok) {
        toast.success("Test submitted successfully!", { id: 'submit' });
        router.push(`/analytics/result/${attempt.id}`);
      } else {
        toast.error("Failed to submit test.", { id: 'submit' });
      }
    } catch (e) {
      toast.error("Network error during submission.", { id: 'submit' });
    }
  };

  const currentQ = questions[activeQ];
  if (!currentQ || !responses[currentQ.id]) return <div className="p-8 text-center">Loading Engine...</div>;

  const currentResponse = responses[currentQ.id];

  // Calculate stats for modal
  const stats = { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
  Object.values(responses).forEach(r => {
    if (r.status === 'NOT_VISITED') stats.notVisited++;
    else if (r.is_marked_for_review) stats.marked++;
    else if (r.status === 'ANSWERED') stats.answered++;
    else stats.notAnswered++;
  });

  return (
    <div className="flex flex-col h-screen bg-[#0B0F19] text-white">
      {/* Top Bar */}
      <header className="h-16 bg-[#111624] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-20">
        <div className="font-bold text-sm md:text-lg truncate max-w-[50%]">{test.title}</div>
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="flex items-center gap-2 text-sm md:text-xl font-mono bg-purple-900/30 text-purple-400 px-3 md:px-4 py-1.5 rounded-lg border border-purple-500/20">
            <Clock size={16} className="md:w-5 md:h-5" /> {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => setShowPalette(!showPalette)}
            className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
              <div className="bg-emerald-500 rounded-t-full rounded-bl-full"></div>
              <div className="bg-red-500 rounded-t-full rounded-br-full"></div>
              <div className="bg-purple-600 rounded-full"></div>
              <div className="bg-gray-200 rounded-sm"></div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative">
          
          {/* Question Header */}
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-white/[0.02]">
            <div className="font-semibold text-lg">Question {activeQ + 1}</div>
            <div className="flex gap-4 text-sm text-gray-400 font-medium">
              <span className="text-emerald-400">+{currentQ.positive_marks} Marks</span>
              <span className="text-red-400">-{currentQ.negative_marks} Marks</span>
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto p-8 text-lg">
            <div dangerouslySetInnerHTML={{ __html: currentQ.content }} className="mb-8 prose prose-invert max-w-none" />
            
            <div className="space-y-3 mt-8">
              {currentQ.question_type === 'MCQ' && currentQ.options.map((opt: any) => (
                <label 
                  key={opt.id} 
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    currentResponse.selected_option_id === opt.id 
                      ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'border-white/10 bg-[#111624] hover:border-white/30'
                  }`}
                >
                  <div className="pt-1">
                    <input 
                      type="radio" 
                      name={`q-${currentQ.id}`} 
                      className="w-5 h-5 accent-purple-500"
                      checked={currentResponse.selected_option_id === opt.id}
                      onChange={() => handleOptionSelect(opt.id)}
                    />
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: opt.content }} className="prose prose-invert max-w-none" />
                </label>
              ))}

              {currentQ.question_type === 'MSQ' && currentQ.options.map((opt: any) => {
                const isSelected = (currentResponse.selected_options_array || []).includes(opt.id);
                return (
                  <label 
                    key={opt.id} 
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'border-white/10 bg-[#111624] hover:border-white/30'
                    }`}
                  >
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleMsqToggle(opt.id)}
                        className="w-5 h-5 accent-emerald-500"
                      />
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: opt.content }} className="prose prose-invert max-w-none" />
                  </label>
                )
              })}

              {currentQ.question_type === 'NAT' && (
                <div className="p-6 rounded-xl border border-white/10 bg-[#111624]">
                  <label className="block text-sm font-medium text-gray-400 mb-3">Numerical Answer:</label>
                  <input 
                    type="number"
                    step="any"
                    value={currentResponse.answer_text || ''}
                    onChange={(e) => handleNatChange(e.target.value)}
                    placeholder="Enter value..."
                    className="w-full max-w-sm bg-[#0B0F19] border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-[#111624] border-t border-white/10 flex flex-col md:flex-row items-center justify-between p-4 shrink-0 gap-4">
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <button onClick={handleMarkForReview} className="px-4 md:px-6 py-2.5 rounded-lg font-medium border border-purple-500/50 text-purple-400 hover:bg-purple-900/20 transition-colors flex items-center gap-2 whitespace-nowrap text-sm md:text-base">
                <Bookmark size={18} /> Mark <span className="hidden md:inline">for Review & Next</span>
              </button>
              <button onClick={handleClearResponse} className="px-4 md:px-6 py-2.5 rounded-lg font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors whitespace-nowrap text-sm md:text-base">
                Clear <span className="hidden md:inline">Response</span>
              </button>
            </div>
            
            <button onClick={handleSaveAndNext} className="w-full md:w-auto px-6 md:px-8 py-2.5 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(5,150,105,0.3)] text-sm md:text-base shrink-0">
              Save & Next <ChevronRight size={18} />
            </button>
          </div>
          
          {saving && <div className="absolute bottom-24 right-8 text-xs text-gray-500 flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div> Saving...</div>}
        </main>

        {/* Right Sidebar (Palette) */}
        <aside className={`w-80 bg-[#111624] border-l border-white/10 flex flex-col absolute lg:relative right-0 top-0 h-full z-10 transition-transform duration-300 ${showPalette ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className="grid grid-cols-2 gap-y-3 text-xs font-medium text-gray-300">
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-emerald-500 rounded-t-full rounded-bl-full text-white flex items-center justify-center font-bold text-[10px]">1</div> Answered</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-red-500 rounded-t-full rounded-br-full text-white flex items-center justify-center font-bold text-[10px]">2</div> Not Answered</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-purple-600 rounded-full text-white flex items-center justify-center font-bold text-[10px]">3</div> Marked</div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-200 border border-gray-400 text-gray-800 rounded-sm flex items-center justify-center font-bold text-[10px]">4</div> Not Visited</div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-300">
              <div className="w-6 h-6 bg-purple-600 rounded-full text-white flex items-center justify-center font-bold text-[10px] relative">
                5
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center border border-[#111624]"><CheckCircle size={8} color="white" /></div>
              </div>
              <span>Answered & Marked for Review</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-sm font-semibold mb-4 text-white">Question Palette</div>
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q: any, i: number) => {
                const r = responses[q.id] || { status: 'NOT_VISITED', is_marked_for_review: false };
                let bgClass = "bg-gray-200 border-gray-400 text-gray-800 rounded-sm";
                
                if (r.is_marked_for_review) {
                  bgClass = "bg-purple-600 border-purple-600 text-white rounded-full relative shadow-[0_0_8px_rgba(168,85,247,0.5)]";
                } else if (r.status === 'ANSWERED') {
                  bgClass = "bg-emerald-500 border-emerald-500 text-white rounded-t-full rounded-bl-full shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                } else if (r.status === 'NOT_ANSWERED') {
                  bgClass = "bg-red-500 border-red-500 text-white rounded-t-full rounded-br-full shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                }
                
                if (activeQ === i) {
                  bgClass += " ring-2 ring-white ring-offset-2 ring-offset-[#111624]";
                }

                return (
                  <button 
                    key={q.id} 
                    onClick={() => {
                      navigateToQuestion(i);
                      if(window.innerWidth < 1024) setShowPalette(false);
                    }}
                    className={`w-10 h-10 flex items-center justify-center font-bold text-sm border transition-all ${bgClass}`}
                  >
                    {i + 1}
                    {r.is_marked_for_review && isAnswered(r) && (
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#111624]">
                         <CheckCircle size={10} color="white" />
                       </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-white/10 shrink-0">
            <button onClick={() => { setShowSubmitModal(true); setShowPalette(false); }} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transition-colors">
              Submit Test
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {showPalette && (
          <div onClick={() => setShowPalette(false)} className="fixed inset-0 bg-black/50 z-[5] lg:hidden"></div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111624] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 text-amber-400 mb-6">
              <AlertTriangle size={32} />
              <h2 className="text-2xl font-bold text-white">Submit Test?</h2>
            </div>
            
            <p className="text-gray-300 mb-6">Are you sure you want to submit? You will not be able to change your answers after submission.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-400">{stats.answered}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Answered</div>
              </div>
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400">{stats.marked}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Marked</div>
              </div>
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{stats.notAnswered}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">Not Answered</div>
              </div>
              <div className="bg-[#0B0F19] p-4 rounded-xl border border-white/10">
                <div className="text-2xl font-bold text-gray-400">{stats.notVisited}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Not Visited</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-3 rounded-xl border border-white/10 font-bold text-gray-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={submitTest} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-colors">
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
