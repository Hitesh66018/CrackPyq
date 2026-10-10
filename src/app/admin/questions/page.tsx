import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react";

export default async function QuestionBankPage() {
  // Fetch questions with related topic and subject info
  const { data: questions } = await supabase
    .from("questions")
    .select(`
      id,
      question_text,
      status,
      positive_marks,
      negative_marks,
      topic:topics (
        name,
        subject:subjects (
          name,
          exam:exams (name)
        )
      )
    `)
    .order("id", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
          <p className="text-gray-500">Manage all questions, approve drafts, and edit content.</p>
        </div>
        <Link 
          href="/admin/questions/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Add Question
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search questions by keyword..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
          <Filter size={20} /> Filters
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Question Preview</th>
                <th className="p-4 font-semibold">Hierarchy (Exam > Subject)</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions && questions.length > 0 ? (
                questions.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500 font-mono text-sm">#{q.id}</td>
                    <td className="p-4">
                      <p className="text-gray-900 font-medium line-clamp-2 max-w-md">
                        {q.question_text}
                      </p>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">+{q.positive_marks}</span>
                        <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded">-{q.negative_marks}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">{q.topic?.subject?.exam?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{q.topic?.subject?.name || "Unknown"} &rarr; {q.topic?.name || "Unknown"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${q.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                          q.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600 p-1">
                        <Edit size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-red-600 p-1 ml-2">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No questions found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {questions?.length || 0} results</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
