"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function BulkImportPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/questions" className="text-gray-500 hover:text-gray-900 bg-white p-2 border border-gray-200 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h2>
          <p className="text-gray-500">Upload a CSV or Excel file to automatically extract and format multiple questions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        {/* Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${file ? 'bg-green-50 border-green-500' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="text-green-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-1">{file.name}</h3>
              <p className="text-gray-500 mb-6">{(file.size / 1024).toFixed(2)} KB • Ready to process</p>
              <button 
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove file and select another
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Drag & Drop your file here</h3>
              <p className="text-gray-500 mb-6">Supports .csv, .xlsx, .xls</p>
              
              <label className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 cursor-pointer transition-colors shadow-sm inline-block">
                Browse Files
                <input type="file" className="hidden" accept=".csv, .xlsx" onChange={handleChange} />
              </label>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
          <h4 className="flex items-center gap-2 font-bold text-blue-900 mb-3">
            <FileSpreadsheet size={20} className="text-blue-600" />
            Import Instructions
          </h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800/80">
            <li>Ensure your file has the following column headers: <code>exam_id</code>, <code>subject_id</code>, <code>topic_id</code>, <code>question_text</code>, <code>option_a</code>, <code>option_b</code>, <code>option_c</code>, <code>option_d</code>, <code>correct_answer</code> (A, B, C, or D).</li>
            <li>You can optionally include <code>detailed_solution</code>, <code>positive_marks</code>, and <code>negative_marks</code>.</li>
            <li>All imported questions will initially be saved as <strong>DRAFT</strong> status for manual review before publishing.</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <button className="text-sm font-semibold text-blue-700 hover:underline">
              &darr; Download CSV Template
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button 
            disabled={!file}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
              ${file 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Start Processing Data <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Missed ArrowRight import
import { ArrowRight } from "lucide-react";
