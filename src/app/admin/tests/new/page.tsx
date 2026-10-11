export const instant = false;

import { supabase } from "@/lib/supabase";
import { createTest } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function NewTestPage() {
  const { data: exams } = await supabase.from("exams").select("id, name").order("name");

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tests" className="text-gray-500 hover:text-gray-900 bg-white p-2 border border-gray-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Mock Test</h2>
          <p className="text-gray-500">Set up the metadata for a new mock test.</p>
        </div>
      </div>

      <form action={createTest} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
            <input 
              type="text" 
              name="title" 
              required
              placeholder="e.g. GATE 2024 Full Mock 1"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Exam</label>
            <select 
              name="exam_id" 
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Exam --</option>
              {exams?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
            <input 
              type="number" 
              name="duration_minutes" 
              required
              defaultValue={180}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions for Students</label>
          <textarea 
            name="instructions" 
            rows={4}
            placeholder="Important instructions to display before the test begins..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
          <select 
            name="status" 
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="DRAFT">Draft (Not visible to students)</option>
            <option value="PUBLISHED">Published (Live)</option>
          </select>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors">
            <Save size={20} /> Create Test Frame
          </button>
        </div>
      </form>
    </div>
  );
}
