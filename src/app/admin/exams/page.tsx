export const instant = false;

import Link from "next/link";
import { Plus, Folder, Layout, BookOpen, Layers, CheckCircle2, Clock, Calendar, ShieldAlert } from "lucide-react";
import { db } from "@/utils/db";

export default async function ExamsCMSPage() {
  const pool = db;

  // Query all exams with their category, subjects, and topics
  const query = `
    SELECT 
      e.id as exam_id, e.name as exam_name, e.code as exam_code, e.status as exam_status,
      e.syllabus_version, e.total_papers, e.display_order as exam_order,
      c.id as category_id, c.name as category_name, c.code as category_code,
      s.id as subject_id, s.name as subject_name, s.code as subject_code,
      t.id as topic_id, t.name as topic_name, t.code as topic_code
    FROM exams e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN subjects s ON e.id = s.exam_id
    LEFT JOIN topics t ON s.id = t.subject_id
    ORDER BY c.display_order ASC NULLS LAST, e.display_order ASC, s.display_order ASC NULLS LAST, s.id ASC, t.display_order ASC NULLS LAST, t.id ASC
  `;

  const { rows } = await pool.query(query);

  // Group by Category -> Exam -> Subject -> Topics
  const categoriesMap: Record<string, any> = {};

  for (const row of rows) {
    const catKey = row.category_id || "uncategorized";
    if (!categoriesMap[catKey]) {
      categoriesMap[catKey] = {
        id: row.category_id,
        name: row.category_name || "General / Other",
        code: row.category_code || "GEN",
        exams: {}
      };
    }

    const examKey = row.exam_id;
    if (!categoriesMap[catKey].exams[examKey]) {
      categoriesMap[catKey].exams[examKey] = {
        id: row.exam_id,
        name: row.exam_name,
        code: row.exam_code,
        status: row.exam_status || "PLANNED",
        syllabus_version: row.syllabus_version || "STANDARD",
        total_papers: row.total_papers || 0,
        subjects: {}
      };
    }

    if (row.subject_id) {
      const subKey = row.subject_id;
      if (!categoriesMap[catKey].exams[examKey].subjects[subKey]) {
        categoriesMap[catKey].exams[examKey].subjects[subKey] = {
          id: row.subject_id,
          name: row.subject_name,
          code: row.subject_code,
          topics: []
        };
      }
      if (row.topic_id) {
        categoriesMap[catKey].exams[examKey].subjects[subKey].topics.push({
          id: row.topic_id,
          name: row.topic_name,
          code: row.topic_code
        });
      }
    }
  }

  const categories = Object.values(categoriesMap).map((cat: any) => ({
    ...cat,
    exams: Object.values(cat.exams).map((ex: any) => ({
      ...ex,
      subjects: Object.values(ex.subjects)
    }))
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY_FOR_IMPORT":
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5"><CheckCircle2 size={12} /> Ready for Ingestion</span>;
      case "CONTENT_AVAILABLE":
      case "AVAILABLE":
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5"><CheckCircle2 size={12} /> Active / Live</span>;
      case "CONFIGURING":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5"><Clock size={12} /> Configuring</span>;
      case "PLANNED":
      default:
        return <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5"><Clock size={12} /> Catalog Planned</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="text-blue-500" /> Universal Exam Taxonomy & Syllabus
          </h2>
          <p className="text-gray-400">Manage hierarchical taxonomy: Exam Family &rarr; Exam &rarr; Syllabus &rarr; Subjects &rarr; Topics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/questions/import-pdf"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
          >
            Import Question Paper
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm text-sm">
            <Plus size={18} /> New Exam
          </button>
        </div>
      </div>

      {categories.map((cat: any) => (
        <div key={cat.id || cat.name} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold text-white tracking-wide uppercase text-sm text-gray-400">
              Exam Family: <span className="text-blue-400 font-semibold">{cat.name}</span>
            </h3>
            <span className="text-xs text-gray-500">({cat.exams.length} exams)</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {cat.exams.map((exam: any) => {
              const totalTopics = exam.subjects.reduce((acc: number, s: any) => acc + s.topics.length, 0);

              return (
                <div key={exam.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="bg-gray-900/80 px-6 py-4 border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="bg-blue-950 border border-blue-800 text-blue-400 p-2.5 rounded-lg">
                        <BookOpen size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-white">{exam.name}</h4>
                          {exam.code && (
                            <span className="bg-gray-800 text-gray-300 font-mono text-xs px-2 py-0.5 rounded border border-gray-700">
                              {exam.code}
                            </span>
                          )}
                          {getStatusBadge(exam.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>Syllabus: <strong className="text-gray-200">{exam.syllabus_version}</strong></span>
                          <span>•</span>
                          <span>Subjects: <strong className="text-gray-200">{exam.subjects.length}</strong></span>
                          <span>•</span>
                          <span>Topics: <strong className="text-gray-200">{totalTopics}</strong></span>
                          <span>•</span>
                          <span>Configured Papers: <strong className="text-gray-200">{exam.total_papers || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/questions/import-pdf?exam_id=${exam.id}`}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ingest PDF
                      </Link>
                      <button className="text-xs font-medium text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Body: Subjects & Topics */}
                  <div className="p-6">
                    {exam.subjects && exam.subjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exam.subjects.map((subject: any) => (
                          <div key={subject.id} className="border border-gray-800 rounded-lg p-4 bg-gray-950/50 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-gray-200 text-sm flex items-center gap-2">
                                  <Layout size={15} className="text-blue-400 flex-shrink-0" />
                                  <span>{subject.name}</span>
                                </h5>
                                <span className="text-[11px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                  {subject.topics.length} topics
                                </span>
                              </div>

                              <div className="space-y-1.5 pl-2 mt-3 max-h-48 overflow-y-auto pr-1">
                                {subject.topics.map((topic: any) => (
                                  <div key={topic.id} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                                    <Folder size={12} className="text-gray-500 flex-shrink-0" />
                                    <span className="truncate">{topic.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-gray-800/60 flex justify-between items-center text-[11px]">
                              <button className="text-blue-400 hover:underline flex items-center gap-1">
                                <Plus size={11} /> Add Topic
                              </button>
                              <span className="text-gray-600 font-mono text-[10px]">{subject.code || `SUB_${subject.id}`}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-950/40 border border-dashed border-gray-800 rounded-lg p-6 text-center text-sm text-gray-500">
                        No subjects mapped to this exam yet.
                        {exam.status === "PLANNED" && " This exam is planned in the catalog; configure its official syllabus when ready."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
