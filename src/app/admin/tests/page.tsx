import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, BookOpen, Clock, FileText, CheckCircle2 } from "lucide-react";

export const instant = false;

export default async function MockTestsPage() {
  const { data: tests } = await supabase
    .from("tests")
    .select("*, exam:exams(name)")
    .order("id", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mock Tests</h2>
          <p className="text-gray-500">Create and manage timed mock tests built from the question bank.</p>
        </div>
        <Link 
          href="/admin/tests/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Create Test
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests && tests.length > 0 ? (
          tests.map((test) => (
            <div key={test.id} className="bg-[#111624] p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${test.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-purple-600/20 text-purple-400 text-white'}`}>
                  {test.status}
                </span>
                <span className="text-sm font-medium text-gray-500 bg-[#0B0F19] px-2 py-1 rounded">
                  ID: #{test.id}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{test.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{test.instructions || "No instructions provided."}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={16} />
                  <span>{test.exam?.name || "Unknown Exam"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  <span>{test.duration_minutes} mins</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <Link href={`/admin/tests/${test.id}`} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                  <FileText size={16} /> Manage Questions
                </Link>
                <button className="text-gray-500 text-sm hover:text-gray-900">Edit Settings</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-[#111624] rounded-2xl border border-gray-200 border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Tests Found</h3>
            <p className="text-gray-500">You haven't created any mock tests yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
