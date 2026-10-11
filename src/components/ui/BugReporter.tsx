"use client";

import { useState } from 'react';
import { Bug, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function BugReporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (res.ok) {
        toast.success("Bug reported successfully! Thank you.");
        setIsOpen(false);
        setDescription('');
      } else {
        throw new Error("Failed to report bug");
      }
    } catch (err) {
      toast.error("Could not send the bug report. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Emoji Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#111624] border border-white/10 hover:border-purple-500/50 shadow-2xl rounded-full flex items-center justify-center transition-all hover:scale-110 z-50 group"
        title="Report a Bug"
      >
        <span className="text-2xl group-hover:hidden">🐞</span>
        <Bug className="text-purple-400 hidden group-hover:block" size={24} />
      </button>

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111624] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🐞</span> Report an Issue
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <p className="text-sm text-gray-400 mb-4">
                Found a glitch, typo, or something broken? Let us know and we'll fix it right away!
              </p>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug here... (e.g., The timer froze on question 3)"
                className="w-full bg-[#0B0F19] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 min-h-[120px] resize-none mb-6"
                required
              />
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {isSubmitting ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
