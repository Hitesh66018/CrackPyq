export const instant = false;

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from '@/utils/db';


async function updateExam(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  
  const pool = db;
  
  await pool.query("UPDATE exams SET name = $1, description = $2 WHERE id = $3", [name, description, id]);
  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const pool = db;
  
  const result = await pool.query("SELECT id, name, description FROM exams WHERE id = $1", [id]);
  const exam = result.rows[0];

  if (!exam) return <div>Exam not found</div>;

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Edit Exam: {exam.name}</h2>
      
      <form action={updateExam} className="space-y-4">
        <input type="hidden" name="id" value={exam.id} />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
          <input 
            type="text"
            name="name" 
            defaultValue={exam.name} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            name="description" 
            defaultValue={exam.description} 
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-4 pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
            Save Changes
          </button>
          <a href="/admin/exams" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
