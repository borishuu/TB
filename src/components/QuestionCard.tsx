'use client';

import { useState } from 'react';

interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

export default function QuestionCard({ question }: { question: Question }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition">
            <div className="flex justify-between">
                <p className="font-semibold max-w-2xl">{question.number}. {question.questionText}</p>
                <p className="">Type: {question.questionType}</p>
            </div>

            {question.questionType === 'mcq' && (
                <ul className="mt-2 space-y-1">
                    {question.options?.map((option, idx) => (
                        <li key={idx} className="p-2 border rounded">{option}</li>
                    ))}
                </ul>
            )}

            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 button"
            >
                {isExpanded ? "Hide Answer" : "Show Answer"}
            </button>

            {isExpanded && (
                <div className="mt-2 bg-gray-100 p-3 rounded-lg">
                    <p><strong>Answer:</strong> {question.correctAnswer}</p>
                </div>
            )}
        </div>
    );
}
