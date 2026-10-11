import { supabase } from "@/lib/supabase";
import { createQuestion } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const instant = false;

export default async function NewQuestionPage() {
  // Fetch topics for the dropdown hierarchy
  const { data: topics } = await supabase
    .from("topics")
    .select(`
      id,
      name,
      subject:subjects (
        name,
        exam:exams (name)
      )
    `)
    .order("id");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/questions" className="text-gray-500 hover:text-gray-900 bg-white p-2 border border-gray-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Question</h2>
          <p className="text-gray-500">Add a new question to the database. It will be saved as PENDING REVIEW.</p>
        </div>
      </div>

      <form action={createQuestion} className="space-y-6">
        
        {/* Hierarchy Selection */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Placement (Where does this go?)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Topic</label>
            <select 
              name="topic_id" 
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose a Topic --</option>
              {topics?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.subject?.exam?.name} &rarr; {t.subject?.name} &rarr; {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Question Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea 
              name="question_text" 
              required
              rows={4}
              placeholder="Enter the main question text here. (LaTeX/Markdown support coming soon)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Positive Marks</label>
              <input 
                type="number" 
                name="positive_marks" 
                defaultValue="4"
                step="0.5"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
              <input 
                type="number" 
                name="negative_marks" 
                defaultValue="1"
                step="0.25"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Options & Answer Key</h3>
          <p className="text-sm text-gray-500 mb-4">Enter the 4 options and select the radio button next to the correct one.</p>
          
          {[0, 1, 2, 3].map((index) => {
            const label = String.fromCharCode(65 + index); // A, B, C, D
            return (
              <div key={index} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="correct_option" 
                  value={index} 
                  required
                  defaultChecked={index === 0}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
                <div className="font-bold text-gray-400 w-6">Option {label}</div>
                <input 
                  type="text" 
                  name={`option_${label.toLowerCase()}`} 
                  required
                  placeholder={`Enter Option ${label}`}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Detailed Solution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Detailed Solution</h3>
          <div>
            <textarea 
              name="detailed_solution" 
              required
              rows={4}
              placeholder="Explain why the correct answer is right and why the others are wrong."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            ></textarea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pb-12">
          <Link href="/admin/questions" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors">
            <Save size={20} /> Save to Review Queue
          </button>
        </div>
      </form>
    </div>
  );
}
