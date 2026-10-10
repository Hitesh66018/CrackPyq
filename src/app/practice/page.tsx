import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import PracticeClient from "./PracticeClient"; // We will build this interactive part next

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topicId?: string }> }) {
  const { topicId } = await searchParams;

  if (!topicId) {
    redirect("/exams");
  }

  // Fetch questions for this topic, including their options
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*, options(*)")
    .eq("topic_id", topicId);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 max-w-md">
          <AlertCircle />
          <p>Error loading questions: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-gray-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Found</h2>
          <p className="text-gray-600 mb-6">There are currently no questions uploaded for this specific topic.</p>
          <Link href="/exams" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors inline-block w-full">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  // Render the interactive client component, passing the initial data
  return <PracticeClient questions={questions} />;
}
