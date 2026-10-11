"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, Download, Trash2 } from "lucide-react";
import Papa from "papaparse";

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{message?: string, error?: string} | null>(null);
  
  // New state for Preview
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setParseErrors([]);
    
    // Parse immediately for preview
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const errors = [];
        
        if (data.length === 0) {
          errors.push("The CSV file appears to be empty.");
        } else {
          // Check required headers
          const firstRow = data[0];
          const required = ['topic_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
          const missing = required.filter(col => !(col in firstRow));
          if (missing.length > 0) {
            errors.push(`Missing required columns: ${missing.join(", ")}`);
          }
        }
        
        setParseErrors(errors);
        setPreviewData(data);
      },
      error: (error: any) => {
        setParseErrors([error.message]);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || parseErrors.length > 0) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult({ message: data.message });
      setFile(null);
      setPreviewData([]);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "topic_id,question_text,option_a,option_b,option_c,option_d,correct_answer,detailed_solution,positive_marks,negative_marks\n";
    const example = '1,"What is the capital of France?","London","Berlin","Paris","Madrid","C","Paris is the capital.",4,1\n';
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pyq_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/questions" className="text-gray-500 hover:text-gray-900 bg-white p-2 border border-gray-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced CSV Importer</h2>
          <p className="text-gray-500">Preview and validate your questions before bulk inserting into the database.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">1. Upload File</h3>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${file && parseErrors.length === 0 ? 'bg-green-50 border-green-500' : ''}
                ${parseErrors.length > 0 ? 'bg-red-50 border-red-500' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className={`${parseErrors.length > 0 ? 'text-red-500' : 'text-green-500'} mb-3`} size={40} />
                  <h4 className="text-sm font-bold text-gray-900 mb-1 truncate w-full px-4">{file.name}</h4>
                  <p className="text-xs text-gray-500 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                  <button 
                    onClick={() => { setFile(null); setPreviewData([]); setParseErrors([]); }}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="text-blue-600 mx-auto mb-3" size={32} />
                  <p className="text-sm text-gray-600 mb-4">Drag .csv here or</p>
                  <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer shadow-sm">
                    Browse
                    <input type="file" className="hidden" accept=".csv" onChange={handleChange} />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
              <Download size={16} /> Need a template?
            </h4>
            <p className="text-xs text-blue-800 mb-4">Download our pre-formatted CSV template to ensure your columns match exactly.</p>
            <button onClick={downloadTemplate} className="w-full bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700">
              Download Template
            </button>
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-900">2. Data Preview</h3>
              {previewData.length > 0 && (
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {previewData.length} rows detected
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              {!file ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <FileSpreadsheet size={48} className="text-gray-200 mb-4" />
                  Upload a file to see preview
                </div>
              ) : parseErrors.length > 0 ? (
                <div className="p-6 text-red-600">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={18} /> Parsing Errors:</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {parseErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-4 py-3">Topic ID</th>
                      <th className="px-4 py-3 w-full">Question</th>
                      <th className="px-4 py-3 text-center">Ans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-500 text-center">{row.topic_id}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={row.question_text}>{row.question_text}</td>
                        <td className="px-4 py-3 font-bold text-green-600 text-center">{row.correct_answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {previewData.length > 50 && (
                <div className="text-center p-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                  Showing first 50 rows only...
                </div>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {result?.message && (
              <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
                <CheckCircle2 size={20} /> {result.message}
              </div>
            )}
            {result?.error && (
              <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle size={20} /> {result.error}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                All questions will be imported as <strong className="text-amber-600">PENDING REVIEW</strong>
              </div>
              <button 
                disabled={!file || parseErrors.length > 0 || isUploading}
                onClick={handleUpload}
                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                  ${(file && parseErrors.length === 0 && !isUploading)
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-md transform hover:scale-[1.02]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {isUploading ? "Importing..." : "Confirm & Import"} <ArrowRight size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
