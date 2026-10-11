"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UploadCloud, FileText, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Key } from "lucide-react";

function ImportPdfPageInner() {
  const searchParams = useSearchParams();
  const exam_id = searchParams.get("exam_id") || "";

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{message?: string, error?: string} | null>(null);

  const handleUpload = async () => {
    if (!paperFile) return;

    if (paperFile.size > 15 * 1024 * 1024 || (keyFile && keyFile.size > 15 * 1024 * 1024)) {
      setResult({ error: "One of the files is too large! Please upload PDFs smaller than 15MB." });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("paperFile", paperFile);
      if (keyFile) formData.append("keyFile", keyFile);
      formData.append("topic_id", "1"); // Dummy topic for MVP
      if (exam_id) formData.append("exam_id", exam_id);

      const res = await fetch("/api/import-pdf", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setResult({ message: data.message });
      setPaperFile(null);
      setKeyFile(null);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsProcessing(false);
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
            <Sparkles className="text-purple-600" /> Advanced AI PDF Extraction
          </h2>
          <p className="text-gray-500">Upload an official Question Paper and its Answer Key. Gemini AI will merge and parse them!</p>
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

        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
          <h4 className="flex items-center gap-2 font-bold text-purple-900 mb-3">
            <Sparkles size={20} className="text-purple-600" /> Gemini Multimodal Fusion
          </h4>
          <p className="text-sm text-purple-800/80 leading-relaxed">
            By uploading both PDFs together, the AI will read the questions from the first document, find the corresponding question numbers in the second document, and automatically map the correct answers into the database. All mathematical equations will be preserved as LaTeX.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            disabled={!paperFile || isProcessing}
            onClick={handleUpload}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
              ${(paperFile && !isProcessing)
                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {isProcessing ? "AI is fusing PDFs..." : "Start AI Extraction"}
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
