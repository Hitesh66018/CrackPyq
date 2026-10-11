"use client";

import { useState } from 'react';
import { Bookmark, MessageCircle, X, Send, Bot, User, BookmarkCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export function QuestionActions({ 
  qId, 
  initialBookmarked,
  questionContext 
}: { 
  qId: number, 
  initialBookmarked: boolean,
  questionContext: any 
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleBookmark = async () => {
    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: qId })
      });
      if (res.ok) {
        setBookmarked(!bookmarked);
        toast.success(bookmarked ? "Removed from Bookmarks" : "Added to Bookmarks!");
      }
    } catch (e) {
      toast.error("Failed to update bookmark.");
    }
  };

  const startTutor = async () => {
    setIsTutorOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: 'model', text: "Hello! I'm your AI Study Assistant. I see your answer for this question. Where did you get stuck?" }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMsgs = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContext,
          history: newMsgs
        })
      });
      
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMsgs, { role: 'model', text: data.reply }]);
      }
    } catch (e) {
      toast.error("Failed to connect to AI tutor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
        <button 
          onClick={toggleBookmark}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            bookmarked ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {bookmarked ? 'Bookmarked' : 'Bookmark Question'}
        </button>

        <button 
          onClick={startTutor}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/50 rounded-lg text-sm font-medium transition-colors"
        >
          <MessageCircle size={16} />
          Chat with AI Tutor
        </button>
      </div>

      {isTutorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111624] border border-white/10 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl overflow-hidden">
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-indigo-400 font-bold">
                <Bot size={24} /> AI Study Assistant
              </div>
              <button onClick={() => setIsTutorOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                    {m.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-purple-600/20 text-white border border-purple-500/30' : 'bg-white/5 text-gray-200 border border-white/10 prose prose-invert prose-sm'}`}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white"/>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    <span className="text-gray-400 text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a doubt..."
                  className="w-full bg-[#0B0F19] border border-white/20 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
