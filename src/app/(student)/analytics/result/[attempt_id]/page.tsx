import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, BarChart2, Target, Clock, BookOpen, Trophy } from 'lucide-react'
import { TopicRadarChart } from '@/components/analytics/TopicRadarChart'
import { QuestionActions } from '@/components/analytics/QuestionActions'
import { db } from '@/utils/db';

export const instant = false;

export default async function ResultAnalysisPage({ params }: { params: Promise<{ attempt_id: string }> }) {
  const { attempt_id } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const pool = db;
  
  try {
    // 1. Fetch Attempt
    const attemptRes = await pool.query("SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2", [attempt_id, user.id]);
    if (attemptRes.rows.length === 0) return redirect('/dashboard');
    const attempt = attemptRes.rows[0];

    // If still in progress, redirect to engine
    if (attempt.status === 'IN_PROGRESS') {
      return redirect(`/practice/engine/${attempt.id}`);
    }

    // 2. Fetch Test
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [attempt.test_id]);
    const test = testRes.rows[0];

    // 3. Fetch Questions & Options
    const questionsRes = await pool.query(`
      SELECT q.id, q.question_type, q.question_text, q.detailed_solution, q.positive_marks, q.negative_marks, q.nat_answer_min, q.nat_answer_max, t.name as topic_name
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE tq.test_id = $1
      ORDER BY tq.order_num ASC
    `, [test.id]);
    const questions = questionsRes.rows;

    const questionIds = questions.map(q => q.id);
    const optionsRes = await pool.query(`
      SELECT * FROM options WHERE question_id = ANY($1::int[]) ORDER BY id ASC
    `, [questionIds]);
    
    // 4. Fetch student's responses
    const detailsRes = await pool.query("SELECT * FROM attempt_details WHERE attempt_id = $1", [attempt.id]);
    const responses = detailsRes.rows;

    // 5. Fetch bookmarks
    const bookmarksRes = await pool.query("SELECT question_id FROM bookmarks WHERE user_id = $1", [user.id]);
    const bookmarkedIds = new Set(bookmarksRes.rows.map((r: any) => r.question_id));

    // Calculate metrics
    let totalMaxMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    questions.forEach(q => {
      totalMaxMarks += Number(q.positive_marks);
      const r = responses.find(r => r.question_id === q.id);
      
      const isAttempted = r && (
        r.selected_option_id || 
        (r.selected_options_array && r.selected_options_array.length > 0) || 
        (r.answer_text && r.answer_text.trim() !== '')
      );

      if (!isAttempted) {
        skippedCount++;
      } else if (r.is_correct) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const accuracy = (correctCount + incorrectCount) > 0 
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
      : 0;

    const totalTimeSpentSeconds = responses.reduce((acc, r) => acc + (Number(r.time_spent_seconds) || 0), 0);
    const totalTimeStr = `${Math.floor(totalTimeSpentSeconds / 60)}m ${totalTimeSpentSeconds % 60}s`;

    // Topic-wise metrics
    const topicStats: Record<string, { total: number, correct: number, incorrect: number, score: number, maxScore: number }> = {};
    
    questions.forEach(q => {
      const topicName = q.topic_name || 'Uncategorized';
      if (!topicStats[topicName]) {
        topicStats[topicName] = { total: 0, correct: 0, incorrect: 0, score: 0, maxScore: 0 };
      }
      
      const r = responses.find(r => r.question_id === q.id);
      topicStats[topicName].total++;
      topicStats[topicName].maxScore += Number(q.positive_marks);
      
      const isAttempted = r && (r.selected_option_id || (r.selected_options_array && r.selected_options_array.length > 0) || (r.answer_text && r.answer_text.trim() !== ''));
      if (isAttempted) {
        if (r.is_correct) {
          topicStats[topicName].correct++;
          topicStats[topicName].score += Number(q.positive_marks);
        } else {
          topicStats[topicName].incorrect++;
          topicStats[topicName].score -= Number(q.negative_marks);
        }
      }
    });

    const radarData = Object.keys(topicStats).map(topic => ({
      subject: topic,
      accuracy: (topicStats[topic].correct + topicStats[topic].incorrect) > 0 
        ? Math.round((topicStats[topic].correct / (topicStats[topic].correct + topicStats[topic].incorrect)) * 100) 
        : 0,
      scorePct: topicStats[topic].maxScore > 0 
        ? Math.round(Math.max(0, (topicStats[topic].score / topicStats[topic].maxScore) * 100)) 
        : 0,
    }));

    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Performance Analysis</h1>
              <p className="text-gray-400 mt-1">{test.title}</p>
            </div>
          </div>
          
          <Link href={`/analytics/leaderboard/${test.id}`} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 w-full sm:w-auto">
            <Trophy size={18} /> View Leaderboard
          </Link>
        </div>

        {/* Top Stats Banner */}
        <div className="bg-[#111624] p-8 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {/* Score */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Target size={16}/> Final Score</span>
              <div className="text-5xl font-black text-white">
                {Number(attempt.total_score).toFixed(2)}
                <span className="text-2xl text-gray-500 font-medium"> / {totalMaxMarks}</span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><BarChart2 size={16}/> Accuracy</span>
              <div className="text-5xl font-black text-white">{accuracy}%</div>
            </div>

            {/* Time Taken */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={16}/> Time Taken</span>
              <div className="text-4xl mt-1 font-black text-white">{totalTimeStr}</div>
            </div>
            
            {/* Breakdown */}
            <div className="flex flex-col lg:col-span-2 justify-center">
              <div className="flex gap-4">
                <div className="flex-1 bg-[#0B0F19] rounded-xl p-4 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400">{correctCount}</div>
                  <div className="text-xs text-gray-500 font-semibold uppercase">Correct</div>
                </div>
                <div className="flex-1 bg-[#0B0F19] rounded-xl p-4 border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">{incorrectCount}</div>
                  <div className="text-xs text-gray-500 font-semibold uppercase">Incorrect</div>
                </div>
                <div className="flex-1 bg-[#0B0F19] rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold text-gray-400">{skippedCount}</div>
                  <div className="text-xs text-gray-500 font-semibold uppercase">Skipped</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Analysis Chart */}
        <div className="bg-[#111624] p-8 rounded-3xl border border-white/10 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 size={24} className="text-emerald-400" /> Topic Strengths & Weaknesses
          </h2>
          <TopicRadarChart data={radarData} />
        </div>

        {/* Detailed Solutions */}
        <div className="space-y-6 mt-12">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-purple-400" /> Detailed Solutions
          </h2>
          
          {questions.map((q, index) => {
            const response = responses.find(r => r.question_id === q.id);
            const isAttempted = response && (
              response.selected_option_id || 
              (response.selected_options_array && response.selected_options_array.length > 0) || 
              (response.answer_text && response.answer_text.trim() !== '')
            );
            const isCorrect = isAttempted && response.is_correct;
            
            const qOptions = optionsRes.rows.filter(o => o.question_id === q.id);

            return (
              <div key={q.id} className="bg-[#111624] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {isAttempted ? (
                      isCorrect ? <CheckCircle2 className="text-emerald-500" size={28} /> : <XCircle className="text-red-500" size={28} />
                    ) : (
                      <MinusCircle className="text-gray-500" size={28} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg text-white">Question {index + 1}</div>
                        <div className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-purple-400 uppercase tracking-wider">{q.question_type}</div>
                        {response?.time_spent_seconds !== undefined && (
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-black/20 px-2 py-1 rounded border border-white/5" title="Time spent on this question">
                            <Clock size={12} />
                            {Math.floor(response.time_spent_seconds / 60)}m {response.time_spent_seconds % 60}s
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {isAttempted ? (
                          isCorrect ? <span className="text-emerald-400">+{q.positive_marks} Marks</span> : <span className="text-red-400">-{q.negative_marks} Marks</span>
                        ) : (
                          <span className="text-gray-500">0 Marks</span>
                        )}
                      </div>
                    </div>
                    
                    <div dangerouslySetInnerHTML={{ __html: q.question_text }} className="prose prose-invert max-w-none text-gray-300 mb-6" />
                    
                    <div className="space-y-3">
                      {(q.question_type === 'MCQ' || q.question_type === 'MSQ') && qOptions.map(opt => {
                        const isStudentChoice = q.question_type === 'MCQ' 
                          ? response?.selected_option_id === opt.id
                          : (response?.selected_options_array || []).includes(opt.id);
                        
                        const isActualCorrect = opt.is_correct;
                        
                        let optStyle = "border-white/10 text-gray-400";
                        if (isActualCorrect) optStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300";
                        else if (isStudentChoice && !isActualCorrect) optStyle = "bg-red-500/10 border-red-500/50 text-red-300";

                        return (
                          <div key={opt.id} className={`p-4 rounded-xl border flex items-start gap-3 ${optStyle}`}>
                            <div className="mt-1 flex-shrink-0">
                              {isStudentChoice && !isActualCorrect && <XCircle size={18} className="text-red-400" />}
                              {isActualCorrect && <CheckCircle2 size={18} className="text-emerald-400" />}
                              {!isStudentChoice && !isActualCorrect && <div className="w-4 h-4 rounded-full border border-gray-600 mt-0.5"></div>}
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: opt.option_text }} className="prose prose-sm prose-invert max-w-none" />
                          </div>
                        )
                      })}

                      {q.question_type === 'NAT' && (
                        <div className="flex flex-col gap-4">
                          <div className={`p-4 rounded-xl border ${isAttempted ? (isCorrect ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' : 'bg-red-500/10 border-red-500/50 text-red-300') : 'border-white/10 text-gray-400'}`}>
                            <span className="text-sm uppercase tracking-wider font-semibold opacity-70 mb-1 block">Your Answer:</span>
                            <span className="text-xl font-bold">{response?.answer_text || '-'}</span>
                          </div>
                          <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/50 text-emerald-300">
                            <span className="text-sm uppercase tracking-wider font-semibold opacity-70 mb-1 block">Correct Answer Range:</span>
                            <span className="text-xl font-bold">{q.nat_answer_min} to {q.nat_answer_max}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {q.detailed_solution && (
                  <div className="p-6 bg-purple-900/10 border-t border-purple-500/20">
                    <h4 className="text-purple-400 font-semibold mb-2 uppercase tracking-wider text-xs">Explanation</h4>
                    <div dangerouslySetInnerHTML={{ __html: q.detailed_solution }} className="prose prose-sm prose-invert max-w-none text-gray-300" />
                  </div>
                )}
                
                <div className="px-6 pb-6">
                  <QuestionActions 
                    qId={q.id} 
                    initialBookmarked={bookmarkedIds.has(q.id)} 
                    questionContext={{
                      question_text: q.question_text,
                      detailed_solution: q.detailed_solution,
                      question_type: q.question_type,
                      positive_marks: q.positive_marks
                    }} 
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } finally {
    
  }
}
