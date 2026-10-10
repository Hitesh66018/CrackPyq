import { supabase } from "@/lib/supabase";
import { Plus, Folder, Layout, BookOpen } from "lucide-react";

export default async function ExamsCMSPage() {
  const { data: exams } = await supabase
    .from("exams")
    .select("*, subjects(*, topics(*))")
    .order("id");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exams & Syllabus Structure</h2>
          <p className="text-gray-500">Manage the hierarchy: Exams &rarr; Subjects &rarr; Topics.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={20} /> New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {exams?.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Exam Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{exam.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block
                    ${exam.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {exam.status || "COMING SOON"}
                  </span>
                </div>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:underline">Edit Exam</button>
            </div>

            {/* Subjects & Topics */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Layout size={18} /> Subjects
                </h4>
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Plus size={16} /> Add Subject
                </button>
              </div>

              {exam.subjects && exam.subjects.length > 0 ? (
                <div className="space-y-4">
                  {exam.subjects.map((subject: any) => (
                    <div key={subject.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-bold text-gray-800">{subject.name}</h5>
                        <button className="text-xs text-blue-600 hover:underline">Edit</button>
                      </div>
                      
                      <div className="pl-4 border-l-2 border-gray-200 mt-3 space-y-2">
                        {subject.topics && subject.topics.length > 0 ? (
                          subject.topics.map((topic: any) => (
                            <div key={topic.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Folder size={14} className="text-gray-400" /> {topic.name}
                              </div>
                              <button className="text-gray-400 hover:text-gray-900">Edit</button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">No topics added.</p>
                        )}
                        <button className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1">
                          <Plus size={12} /> Add Topic
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No subjects added to this exam yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
