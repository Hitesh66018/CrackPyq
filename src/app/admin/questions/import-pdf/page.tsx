"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UploadCloud, FileText, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Key, Loader2, Play } from "lucide-react";

const EXAM_PRESETS: Record<string, { name: string; totalQuestions: number; batchSize: number; defaultRanges: { start: number; end: number; label: string }[] }> = {
  neet: {
    name: "NEET UG (180–200 Qs)",
    totalQuestions: 200,
    batchSize: 30,
    defaultRanges: [
      { start: 1, end: 30, label: "Q1 to Q30 (Physics Sec A)" },
      { start: 31, end: 50, label: "Q31 to Q50 (Physics Sec B)" },
      { start: 51, end: 85, label: "Q51 to Q85 (Chemistry)" },
      { start: 86, end: 100, label: "Q86 to Q100 (Chemistry B)" },
      { start: 101, end: 150, label: "Q101 to Q150 (Botany)" },
      { start: 151, end: 200, label: "Q151 to Q200 (Zoology)" },
    ]
  },
  gate: {
    name: "GATE (65 Qs)",
    totalQuestions: 65,
    batchSize: 30,
    defaultRanges: [
      { start: 1, end: 30, label: "Q1 to Q30 (~15s)" },
      { start: 31, end: 65, label: "Q31 to Q65 (~18s)" }
    ]
  },
  jee: {
    name: "JEE Main / Advanced (75–90 Qs)",
    totalQuestions: 90,
    batchSize: 30,
    defaultRanges: [
      { start: 1, end: 30, label: "Q1 to Q30 (Physics)" },
      { start: 31, end: 60, label: "Q31 to Q60 (Chemistry)" },
      { start: 61, end: 90, label: "Q61 to Q90 (Maths)" }
    ]
  },
  custom: {
    name: "Custom Range (Any Exam)",
    totalQuestions: 200,
    batchSize: 30,
    defaultRanges: []
  }
};

function ImportPdfPageInner() {
  const searchParams = useSearchParams();
  const exam_id = searchParams.get("exam_id") || "";

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>("gate");
  const [startQ, setStartQ] = useState<number>(1);
  const [endQ, setEndQ] = useState<number>(30);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<string>("");
  const [lastPaperId, setLastPaperId] = useState<number | null>(null);
  const [totalExtracted, setTotalExtracted] = useState<number>(0);

  const [result, setResult] = useState<{ message?: string; error?: string } | null>(null);

  const applyRange = (start: number, end: number) => {
    setStartQ(start);
    setEndQ(end);
  };

  const handleUploadSingleBatch = async (customStart?: number, customEnd?: number) => {
    if (!paperFile) return;

    const sQ = customStart ?? startQ;
    const eQ = customEnd ?? endQ;

    setIsProcessing(true);
    setResult(null);
    setCurrentProgress(`Extracting Q${sQ} to Q${eQ}...`);

    try {
      const formData = new FormData();
      formData.append("paperFile", paperFile);
      if (keyFile) formData.append("keyFile", keyFile);
      formData.append("topic_id", "1");
      if (exam_id) formData.append("exam_id", exam_id);
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
        message: `Success! Extracted ${count} questions (Q${sQ}–Q${eQ}). Total extracted for this paper: ${totalExtracted + count}.`
      });

      // Automatically advance range to next batch
      const nextStart = eQ + 1;
      const nextEnd = nextStart + 29;
      setStartQ(nextStart);
      setEndQ(nextEnd);

    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsProcessing(false);
      setCurrentProgress("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/questions" className="text-gray-500 hover:text-gray-900 bg-white p-2 border border-gray-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-purple-600" /> Universal AI Exam PDF Extraction
          </h2>
          <p className="text-gray-500">Fast, timeout-free question ingestion for NEET, GATE, JEE, UPSC, and SSC.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-8">
        
        {result?.message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <CheckCircle2 size={20} /> {result.message}
          </div>
        )}

        {result?.error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
            <AlertCircle size={20} /> {result.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question Paper Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            {paperFile ? (
              <div className="flex flex-col items-center">
                <FileText className="text-blue-500 mb-2" size={32} />
                <h3 className="font-bold text-gray-900 truncate w-full px-4">{paperFile.name}</h3>
                <button onClick={() => setPaperFile(null)} className="text-sm text-red-600 mt-2 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <FileText className="text-gray-400 mx-auto mb-2" size={32} />
                <h3 className="font-bold text-gray-700 mb-1">1. Question Paper PDF</h3>
                <label className="text-sm text-blue-600 font-medium cursor-pointer hover:underline mt-2 inline-block">
                  Browse File
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setPaperFile(e.target.files[0])} />
                </label>
              </>
            )}
          </div>

          {/* Answer Key Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            {keyFile ? (
              <div className="flex flex-col items-center">
                <Key className="text-purple-500 mb-2" size={32} />
                <h3 className="font-bold text-gray-900 truncate w-full px-4">{keyFile.name}</h3>
                <button onClick={() => setKeyFile(null)} className="text-sm text-red-600 mt-2 hover:underline">Remove</button>
              </div>
            ) : (
              <>
                <Key className="text-gray-400 mx-auto mb-2" size={32} />
                <h3 className="font-bold text-gray-700 mb-1">2. Answer Key PDF (Optional)</h3>
                <label className="text-sm text-purple-600 font-medium cursor-pointer hover:underline mt-2 inline-block">
                  Browse File
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && setKeyFile(e.target.files[0])} />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Universal Exam Presets & Batch Range Controller */}
        <div className="bg-[#111624] p-6 rounded-2xl border border-white/10 text-white space-y-5">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Exam Pipeline Configuration</h4>
            {totalExtracted > 0 && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                {totalExtracted} Questions Fused into Paper #{lastPaperId}
              </span>
            )}
          </div>

          {/* Exam Type Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Select Exam Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(EXAM_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(key);
                    if (preset.defaultRanges.length > 0) {
                      setStartQ(preset.defaultRanges[0].start);
                      setEndQ(preset.defaultRanges[0].end);
                    }
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    selectedPreset === key 
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick-Pick Section Buttons for Selected Exam */}
          {EXAM_PRESETS[selectedPreset]?.defaultRanges.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Preset Question Sections (1 Click)</label>
              <div className="flex flex-wrap gap-2">
                {EXAM_PRESETS[selectedPreset].defaultRanges.map((range, idx) => {
                  const isActive = startQ === range.start && endQ === range.end;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyRange(range.start, range.end)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Range Inputs (Valid for ANY exam from 1 to 300) */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-xs font-semibold text-gray-400 mb-2">Active Question Range to Process</label>
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

        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
          <h4 className="flex items-center gap-2 font-bold text-purple-900 mb-2">
            <Sparkles size={20} className="text-purple-600" /> Universal Continuous Ingestion Pipeline
          </h4>
          <p className="text-sm text-purple-800/80 leading-relaxed">
            For exams with 150+ to 200 questions (like <strong>NEET</strong> or <strong>UPSC</strong>), each 30-question chunk completes in ~15 seconds without hitting serverless timeout limits. All chunks automatically append into the same master Question Paper in the Review Queue.
          </p>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-500">
            {isProcessing && (
              <span className="flex items-center gap-2 text-purple-600 font-medium animate-pulse">
                <Loader2 size={18} className="animate-spin" /> {currentProgress || "AI is processing batch..."}
              </span>
            )}
          </div>

          <button 
            disabled={!paperFile || isProcessing}
            onClick={() => handleUploadSingleBatch()}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
              ${(paperFile && !isProcessing)
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {isProcessing ? "Extracting..." : `Extract Q${startQ} to Q${endQ}`}
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
