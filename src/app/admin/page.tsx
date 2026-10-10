import { supabase } from "@/lib/supabase";
import { Database, Users, CheckCircle, Clock } from "lucide-react";

export default async function AdminDashboard() {
  // Fetch some real stats from the database
  const { count: examCount } = await supabase.from("exams").select("*", { count: "exact", head: true });
  const { count: questionCount } = await supabase.from("questions").select("*", { count: "exact", head: true });
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome to the CrackPYQ Admin Panel. Here is what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Database size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Questions</p>
              <h3 className="text-2xl font-bold text-gray-900">{questionCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Examinations</p>
              <h3 className="text-2xl font-bold text-gray-900">{examCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Registered Users</p>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Admin Activity</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          No recent activity found in the audit logs.
        </div>
      </div>
    </div>
  );
}

// Need to import BookOpen which was missed in the main imports
import { BookOpen } from "lucide-react";
