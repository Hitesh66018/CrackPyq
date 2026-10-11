export const instant = false;

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { BookOpen, Calendar, ChevronRight, AlertCircle } from "lucide-react";

export default async function ExamsPage() {
  // Fetch all exams from Supabase
  const { data: exams, error } = await supabase
    .from("exams")
    .select("*")
    .order("name");

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 max-w-md">
          <AlertCircle />
          <p>Error loading exams: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select an Exam</h1>
          <p className="text-gray-600 text-lg">Choose the exam you want to practice for to see available subjects and past papers.</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Link 
                key={exam.id} 
                href={`/exams/${exam.id}`}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <BookOpen size={24} />
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{exam.name}</h2>
                <div className="mt-auto pt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>Latest PYQs Available</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Exams Found</h3>
            <p className="text-gray-500">It looks like the database is empty. Let's add some mock data!</p>
          </div>
        )}
      </main>
    </div>
  );
}
