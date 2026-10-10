import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { BookOpen, ChevronRight, AlertCircle, Layout } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ExamDetailsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;

  // Fetch the specific exam
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    notFound();
  }

  // Fetch subjects for this exam
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*, topics(*)")
    .eq("exam_id", examId)
    .order("name");

  if (subjectsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 max-w-md">
          <AlertCircle />
          <p>Error loading subjects: {subjectsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/exams" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
            &larr; Back to All Exams
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{exam.name}</h1>
          </div>
          <p className="text-gray-600 text-lg mt-2">Select a subject to practice specific topics.</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Syllabus & Subjects</h2>
        
        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                    <Layout size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                </div>
                
                {/* Topics List */}
                <div className="space-y-2 pl-2">
                  {subject.topics && subject.topics.length > 0 ? (
                    subject.topics.map((topic: any) => (
                      <Link
                        key={topic.id}
                        href={`/practice?topicId=${topic.id}`}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors group"
                      >
                        <span className="text-gray-700 font-medium">{topic.name}</span>
                        <span className="flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Practice <ChevronRight size={16} />
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic p-3">No topics added yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <Layout className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Subjects Found</h3>
            <p className="text-gray-500">Admins need to add subjects for this exam.</p>
          </div>
        )}
      </main>
    </div>
  );
}
