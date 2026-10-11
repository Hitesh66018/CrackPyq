"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  UploadCloud, FileText, ArrowLeft, CheckCircle2, AlertCircle, 
  Sparkles, Key, Loader2, Layers, BookOpen, Calendar, HelpCircle,
  Check, Info, Tag
} from "lucide-react";

interface ExamItem {
  id: number;
  name: string;
  code: string;
  status: string;
  category_name?: string;
  category_code?: string;
  total_papers: number;
  syllabus_version: string;
}

interface PaperItem {
  id: number;
  year: number;
  paper_year: number;
  paper_name: string;
  paper_code: string;
  total_marks: string;
}

interface SubjectItem {
  id: number;
  name: string;
  code: string;
  topics: { id: number; name: string; code: string }[];
}

function ImportPdfPageInner() {
  const searchParams = useSearchParams();
  const initialExamId = searchParams.get("exam_id") || "";

  // Dynamic Taxonomy State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("custom");

  // Metadata Fields
  const [year, setYear] = useState<number>(2013);
  const [orsCode, setOrsCode] = useState<string>("A");
  const [inferredNotice, setInferredNotice] = useState<string | null>(null);

  // File Upload State
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);

  // Range State
  const [startQ, setStartQ] = useState<number>(1);
  const [endQ, setEndQ] = useState<number>(15);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const [lastPaperId, setLastPaperId] = useState<number | null>(null);
  const [totalExtracted, setTotalExtracted] = useState<number>(0);
  const [result, setResult] = useState<{ message?: string; error?: string } | null>(null);

  // 1. Fetch available exams on load
  useEffect(() => {
    async function fetchTaxonomy() {
      try {
        const res = await fetch("/api/taxonomy");
        const data = await res.json();
        if (data.exams && Array.isArray(data.exams)) {
          setExams(data.exams);

          // Find default exam: GATE CS or initial param
          let target = data.exams.find((e: ExamItem) => String(e.id) === initialExamId);
          if (!target) {
            target = data.exams.find((e: ExamItem) => e.code === "GATE_CS") || data.exams[0];
          }

          if (target) {
            setSelectedExamId(target.id);
            setSelectedExam(target);
          }
        }
      } catch (err) {
        console.error("Failed to load exams list:", err);
      }
    }
    fetchTaxonomy();
  }, [initialExamId]);

  // 2. Fetch specific exam's papers and subjects when exam changes
  useEffect(() => {
    if (!selectedExamId) return;

    async function fetchExamDetails() {
      try {
        const res = await fetch(`/api/taxonomy?exam_id=${selectedExamId}`);
        const data = await res.json();
        if (data.papers) setPapers(data.papers);
        if (data.subjects) setSubjects(data.subjects);
        if (data.exam) setSelectedExam(data.exam);

        // Set default range depending on exam format
        const code = (data.exam?.code || "").toUpperCase();
        if (code.includes("GATE")) {
          setStartQ(1);
          setEndQ(15);
        } else if (code.includes("NEET")) {
          setStartQ(1);
          setEndQ(30);
        } else if (code.includes("JEE")) {
          setStartQ(1);
          setEndQ(30);
        } else {
          setStartQ(1);
          setEndQ(25);
        }
      } catch (err) {
        console.error("Failed to load exam details:", err);
      }
    }
    fetchExamDetails();
  }, [selectedExamId]);

  // 3. Filename inference logic
  const handlePaperFileChange = (file: File | null) => {
    setPaperFile(file);
    if (!file) {
      setInferredNotice(null);
      return;
    }

    const filename = file.name.toUpperCase();
    let detectedExamId: number | null = null;
    let detectedYear: number | null = null;
    let detectedOrs = "A";

    // Invert year
    const yearMatch = filename.match(/(20\d\d|19\d\d)/);
    if (yearMatch) {
      detectedYear = parseInt(yearMatch[1]);
      setYear(detectedYear);
    }

    // Invert exam
    if (filename.includes("GATE") && (filename.includes("CS") || filename.includes("CSE") || filename.includes("IT"))) {
      const gateCs = exams.find((e) => e.code === "GATE_CS");
      if (gateCs) detectedExamId = gateCs.id;
    } else if (filename.includes("NEET")) {
      const neet = exams.find((e) => e.code === "NEET_UG");
      if (neet) detectedExamId = neet.id;
    } else if (filename.includes("JEE")) {
      const jee = exams.find((e) => e.code === "JEE_MAIN");
      if (jee) detectedExamId = jee.id;
    }

    // Invert ORS / Booklet code (e.g. GATE2013(1) -> Code A)
    if (filename.includes("(1)") || filename.includes("CODE A") || filename.includes("CS-A") || filename.includes("SET A")) {
      detectedOrs = "A";
      setOrsCode("A");
    } else if (filename.includes("(2)") || filename.includes("CODE B") || filename.includes("CS-B") || filename.includes("SET B")) {
      detectedOrs = "B";
      setOrsCode("B");
    } else if (filename.includes("(3)") || filename.includes("CODE C") || filename.includes("CS-C") || filename.includes("SET C")) {
      detectedOrs = "C";
      setOrsCode("C");
    } else if (filename.includes("(4)") || filename.includes("CODE D") || filename.includes("CS-D") || filename.includes("SET D")) {
      detectedOrs = "D";
      setOrsCode("D");
    }

    if (detectedExamId) {
      setSelectedExamId(detectedExamId);
      const ex = exams.find((e) => e.id === detectedExamId);
      if (ex) setSelectedExam(ex);
      setInferredNotice(`Inferred from filename: ${ex?.name || 'GATE CS'} · ${detectedYear || 2013} · Booklet Code ${detectedOrs}`);
    } else if (detectedYear) {
      setInferredNotice(`Inferred Year: ${detectedYear} · Please confirm Exam below`);
    }
  };

  const handleExamChange = (examIdStr: string) => {
    const id = parseInt(examIdStr);
    setSelectedExamId(id);
    const target = exams.find((e) => e.id === id);
    if (target) setSelectedExam(target);
    setSelectedPaperId("custom");
    setTotalExtracted(0);
    setLastPaperId(null);
  };

  const handleUploadSingleBatch = async (customStart?: number, customEnd?: number) => {
    if (!paperFile || !selectedExamId) return;

    const sQ = customStart ?? startQ;
    const eQ = customEnd ?? endQ;

    setIsProcessing(true);
    setResult(null);
    setCurrentProgress(`Extracting Q${sQ} to Q${eQ} for ${selectedExam?.name || 'Selected Exam'} (${year}, Code ${orsCode})...`);

    try {
      const formData = new FormData();
      formData.append("paperFile", paperFile);
      if (keyFile) formData.append("keyFile", keyFile);
      
      // Strict metadata enforcement - NEVER DEFAULTING TO JEE MAIN
      formData.append("exam_id", selectedExamId.toString());
      formData.append("year", year.toString());
      formData.append("ors_code", orsCode);
      if (selectedPaperId !== "custom") {
        formData.append("exam_paper_id", selectedPaperId);
      }

      formData.append("start_q", sQ.toString());
      formData.append("end_q", eQ.toString());
      if (lastPaperId) formData.append("source_paper_id", lastPaperId.toString());

      const res = await fetch("/api/import-pdf", {
        method: "POST",
        body: formData
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(text.length > 200 ? `Server returned an error (${res.status} ${res.statusText})` : text);
      }

      if (!res.ok) throw new Error(data.error || `Upload failed with status ${res.status}`);

      if (data.source_paper_id) setLastPaperId(data.source_paper_id);
      const count = data.extracted_count || 0;
      setTotalExtracted((prev) => prev + count);

      setResult({
        message: `Success! Extracted ${count} questions (Q${sQ}–Q${eQ}) into Review Queue for ${data.exam_name || selectedExam?.name} (${year}, Code ${orsCode}). Total for paper: ${totalExtracted + count}.`
      });

      // Automatically advance range to next batch
      const batchSpan = eQ - sQ + 1;
      const nextStart = eQ + 1;
      const nextEnd = nextStart + batchSpan - 1;
      setStartQ(nextStart);
      setEndQ(nextEnd);

    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsProcessing(false);
      setCurrentProgress("");
    }
  };

  // Preset batches depending on active exam
  const getBatchPresets = () => {
    const code = (selectedExam?.code || "").toUpperCase();
    if (code.includes("GATE")) {
      return [
        { start: 1, end: 15, label: "Q1 to Q15 (1 Mark)" },
        { start: 16, end: 25, label: "Q16 to Q25 (1 Mark)" },
        { start: 26, end: 40, label: "Q26 to Q40 (2 Marks)" },
        { start: 41, end: 55, label: "Q41 to Q55 (2 Marks & Linked)" },
        { start: 56, end: 65, label: "Q56 to Q65 (General Aptitude)" }
      ];
    } else if (code.includes("NEET")) {
      return [
        { start: 1, end: 30, label: "Q1 to Q30 (Physics A)" },
        { start: 31, end: 50, label: "Q31 to Q50 (Physics B)" },
        { start: 51, end: 85, label: "Q51 to Q85 (Chemistry A)" },
        { start: 86, end: 100, label: "Q86 to Q100 (Chemistry B)" },
        { start: 101, end: 150, label: "Q101 to Q150 (Botany)" },
        { start: 151, end: 200, label: "Q151 to Q200 (Zoology)" }
      ];
    } else if (code.includes("JEE")) {
      return [
        { start: 1, end: 30, label: "Q1 to Q30 (Physics)" },
        { start: 31, end: 60, label: "Q31 to Q60 (Chemistry)" },
        { start: 61, end: 90, label: "Q61 to Q90 (Maths)" }
      ];
    }
    return [
      { start: 1, end: 25, label: "Batch 1 (Q1 to Q25)" },
      { start: 26, end: 50, label: "Batch 2 (Q26 to Q50)" },
      { start: 51, end: 75, label: "Batch 3 (Q51 to Q75)" },
      { start: 76, end: 100, label: "Batch 4 (Q76 to Q100)" }
    ];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/questions" className="text-gray-400 hover:text-white bg-gray-900 p-2 border border-gray-800 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-400" /> Universal Exam Ingestion Pipeline
          </h2>
          <p className="text-gray-400">Accurate metadata propagation, strict syllabus classification, & ORS answer key matching.</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm p-8 space-y-8">
        
        {/* Status Alerts */}
        {result?.message && (
          <div className="bg-emerald-950/60 text-emerald-300 p-4 rounded-lg flex items-center gap-2 border border-emerald-800/60">
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" /> 
            <span>{result.message}</span>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-950/60 text-red-300 p-4 rounded-lg flex items-center gap-2 border border-red-800/60">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" /> 
            <span>{result.error}</span>
          </div>
        )}

        {/* Inferred Notice Banner */}
        {inferredNotice && (
          <div className="bg-blue-950/40 border border-blue-500/30 text-blue-300 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-400 flex-shrink-0" />
              <span>{inferredNotice}</span>
            </div>
            <span className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-200 font-medium">Auto-Suggested</span>
          </div>
        )}

        {/* 1. PDF File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Paper Upload */}
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-950 hover:bg-gray-900 transition-colors">
            {paperFile ? (
              <div className="flex flex-col items-center">
                <FileText className="text-blue-400 mb-2" size={32} />
                <h3 className="font-bold text-white truncate w-full px-4">{paperFile.name}</h3>
                <span className="text-xs text-gray-400 mt-1">{(paperFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <button onClick={() => handlePaperFileChange(null)} className="text-sm text-red-400 mt-2 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <FileText className="text-gray-500 mx-auto mb-2" size={32} />
                <h3 className="font-bold text-gray-200 mb-1">1. Question Paper PDF</h3>
                <p className="text-xs text-gray-400 mb-2">e.g. GATE2013(1).pdf</p>
                <label className="text-sm text-blue-400 font-medium cursor-pointer hover:underline inline-block bg-blue-950/60 border border-blue-800/60 px-4 py-1.5 rounded-lg">
                  Browse File
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && handlePaperFileChange(e.target.files[0])} />
                </label>
              </>
            )}
          </div>

          {/* Answer Key Upload */}
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-950 hover:bg-gray-900 transition-colors">
            {keyFile ? (
              <div className="flex flex-col items-center">
                <Key className="text-purple-400 mb-2" size={32} />
                <h3 className="font-bold text-white truncate w-full px-4">{keyFile.name}</h3>
                <span className="text-xs text-gray-400 mt-1">{(keyFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <button onClick={() => setKeyFile(null)} className="text-sm text-red-400 mt-2 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <Key className="text-gray-500 mx-auto mb-2" size={32} />
                <h3 className="font-bold text-gray-200 mb-1">2. Answer Key PDF (Optional)</h3>
                <p className="text-xs text-gray-400 mb-2">e.g. Key_CS_2013.pdf (ORS Columns A-D)</p>
                <label className="text-sm text-purple-400 font-medium cursor-pointer hover:underline inline-block bg-purple-950/60 border border-purple-800/60 px-4 py-1.5 rounded-lg">
                  Browse File
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setKeyFile(e.target.files[0])} />
                </label>
              </>
            )}
          </div>
        </div>

        {/* 2. Confirmed Exam & Paper Metadata Propagation */}
        <div className="bg-[#111624] p-6 rounded-2xl border border-white/10 text-white space-y-5">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} /> 2. Confirm Exam & Provenance Metadata
            </h4>
            <span className="text-xs text-gray-400">
              Exam ID: <strong className="text-white font-mono">{selectedExamId || 'None'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Exam Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Target Exam <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedExamId || ""}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled>-- Select Exam (Required) --</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Year */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Exam Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1990"
                max="2030"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2013)}
                className="w-full bg-[#0B0F19] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* ORS / Booklet Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Booklet / ORS Code
              </label>
              <select
                value={orsCode}
                onChange={(e) => setOrsCode(e.target.value)}
                className="w-full bg-[#0B0F19] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="A">Code A (Default for GATE2013(1))</option>
                <option value="B">Code B</option>
                <option value="C">Code C</option>
                <option value="D">Code D</option>
              </select>
            </div>
          </div>

          {/* Paper Session */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Historical Paper Definition (Optional)
            </label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full bg-[#0B0F19] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="custom">-- Create / Link as New Master Paper --</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.paper_name} ({p.year}) — {p.paper_code}
                </option>
              ))}
            </select>
          </div>

          {/* Active Taxonomy Preview Pill */}
          <div className="text-xs text-gray-400 bg-black/30 p-3 rounded-lg border border-white/5 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-300">Target Syllabus Subjects:</span>
            {subjects.length > 0 ? (
              subjects.slice(0, 6).map((s) => (
                <span key={s.id} className="bg-white/5 px-2 py-0.5 rounded text-gray-300 border border-white/5">
                  {s.name}
                </span>
              ))
            ) : (
              <span className="italic text-gray-500">Loading syllabus subjects...</span>
            )}
            {subjects.length > 6 && (
              <span className="text-purple-400 font-semibold">+{subjects.length - 6} more</span>
            )}
          </div>
        </div>

        {/* 3. Batch Range Controller */}
        <div className="bg-[#111624] p-6 rounded-2xl border border-white/10 text-white space-y-5">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
              Batch Ingestion Controller
            </h4>
            {totalExtracted > 0 && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                {totalExtracted} Questions Fused into Paper #{lastPaperId}
              </span>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">1-Click Batch Range Presets for {selectedExam?.name || 'Selected Exam'}</label>
            <div className="flex flex-wrap gap-2">
              {getBatchPresets().map((range, idx) => {
                const isActive = startQ === range.start && endQ === range.end;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStartQ(range.start);
                      setEndQ(range.end);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Range */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-xs font-semibold text-gray-400 mb-2">Active Question Range to Ingest</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">From Q</span>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={startQ}
                  onChange={(e) => setStartQ(parseInt(e.target.value) || 1)}
                  className="w-20 bg-[#0B0F19] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">To Q</span>
                <input
                  type="number"
                  min={startQ}
                  max="300"
                  value={endQ}
                  onChange={(e) => setEndQ(parseInt(e.target.value) || startQ)}
                  className="w-20 bg-[#0B0F19] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:outline-none focus:border-purple-500"
                />
              </div>
              <span className="text-xs text-gray-400 ml-2">
                ({endQ - startQ + 1} questions · ~15s execution)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-400">
            {isProcessing && (
              <span className="flex items-center gap-2 text-purple-400 font-medium animate-pulse">
                <Loader2 size={18} className="animate-spin" /> {currentProgress || "AI is processing batch..."}
              </span>
            )}
          </div>

          <button 
            disabled={!paperFile || isProcessing || !selectedExamId}
            onClick={() => handleUploadSingleBatch()}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
              ${(paperFile && !isProcessing && selectedExamId)
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-md' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}`}
          >
            {isProcessing ? "Ingesting..." : `Ingest Q${startQ} to Q${endQ} into Review Queue`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImportPdfPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <ImportPdfPageInner />
    </Suspense>
  );
}
