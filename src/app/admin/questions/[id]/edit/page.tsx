import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from '@/utils/db';

export const instant = false;

async function updateQuestion(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const question_text = formData.get("question_text") as string;
  
  const pool = db;
  
  await pool.query("UPDATE questions SET question_text = $1 WHERE id = $2", [question_text, id]);
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const pool = db;
  
  const result = await pool.query("SELECT id, question_text FROM questions WHERE id = $1", [id]);
  const question = result.rows[0];

  if (!question) return <div>Question not found</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Edit Question #{question.id}</h2>
      
      <form action={updateQuestion} className="space-y-4">
        <input type="hidden" name="id" value={question.id} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text (Supports LaTeX)</label>
          <textarea 
            name="question_text" 
            defaultValue={question.question_text} 
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-4 pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            Save Changes
          </button>
          <a href="/admin/questions" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
