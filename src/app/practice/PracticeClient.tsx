"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Clock, Lightbulb } from "lucide-react";

type Option = {
  id: number;
  option_text: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  question_text: string;
  detailed_solution: string;
  positive_marks: number;
  negative_marks: number;
  options: Option[];
};

export default function PracticeClient({ questions }: { questions: Question[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    setIsSubmitted(true);
    const option = currentQuestion.options.find(o => o.id === selectedOption);
    
    if (option?.is_correct) {
      setScore(s => s + currentQuestion.positive_marks);
    } else {
      setScore(s => s - currentQuestion.negative_marks);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/exams" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium">
            <ArrowLeft size={16} /> Exit
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <span className="font-semibold text-gray-900">Practice Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium text-sm">
            <Clock size={16} />
            <span>00:00</span> {/* Timer placeholder */}
          </div>
          <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm">
            Score: {score.toFixed(2)}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-grow flex flex-col">
          {/* Question Section */}
          <div className="p-6 md:p-8 border-b border-gray-100 flex-grow">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-bold text-gray-400 tracking-wider uppercase">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex gap-2 text-sm font-medium">
                <span className="text-green-600 bg-green-50 px-2 py-1 rounded">+{currentQuestion.positive_marks}</span>
                <span className="text-red-600 bg-red-50 px-2 py-1 rounded">-{currentQuestion.negative_marks}</span>
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl text-gray-900 font-medium leading-relaxed mb-8">
              {currentQuestion.question_text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option.id;
                let optionStyle = "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                
                if (isSubmitted) {
                  if (option.is_correct) {
                    optionStyle = "border-green-500 bg-green-50";
                  } else if (isSelected && !option.is_correct) {
                    optionStyle = "border-red-500 bg-red-50";
                  } else {
                    optionStyle = "border-gray-200 opacity-50";
                  }
                } else if (isSelected) {
                  optionStyle = "border-blue-600 bg-blue-50 ring-1 ring-blue-600";
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => !isSubmitted && setSelectedOption(option.id)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${optionStyle}`}
                  >
                    <span className="text-gray-800">{option.option_text}</span>
                    {isSubmitted && option.is_correct && <CheckCircle2 className="text-green-600" />}
                    {isSubmitted && isSelected && !option.is_correct && <XCircle className="text-red-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solution Area (Only visible after submission) */}
          {isSubmitted && (
            <div className="bg-blue-50 p-6 md:p-8 border-t border-blue-100">
              <h3 className="flex items-center gap-2 text-blue-900 font-bold mb-2">
                <Lightbulb size={20} className="text-blue-600" />
                Detailed Solution
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {currentQuestion.detailed_solution}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="bg-gray-50 p-4 md:p-6 flex justify-end gap-4 border-t border-gray-200">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${
                  selectedOption === null 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                Submit Answer
              </button>
            ) : currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                Next Question <ArrowRight size={20} />
              </button>
            ) : (
              <Link
                href="/exams"
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                Finish Practice <CheckCircle2 size={20} />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
