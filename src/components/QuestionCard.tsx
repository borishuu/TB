'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

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
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState<Question>(question);

    // Handle input changes
    const handleChange = (field: keyof Question, value: string | string[]) => {
        setEditedQuestion(prev => ({ ...prev, [field]: value }));
    };

    // Handle save action
    const handleSave = () => {
        console.log("Updated Question:", editedQuestion); // Replace with API call
        setIsEditing(false);
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 pb-10 border border-gray-200 hover:shadow-xl transition relative">
            <div className="flex justify-between">
                {isEditing ? (
                    <input
                        type="text"
                        value={editedQuestion.questionText}
                        onChange={(e) => handleChange("questionText", e.target.value)}
                        className="border p-1 rounded w-full"
                    />
                ) : (
                    <p className="font-semibold max-w-2xl">{question.number}. {question.questionText}</p>
                )}
                <p className="text-sm text-gray-500">Type: {question.questionType}</p>
            </div>

            {question.questionType === 'mcq' && (
                <ul className="mt-2 space-y-1">
                    {isEditing ? (
                        editedQuestion.options?.map((option, idx) => (
                            <input
                                key={idx}
                                type="text"
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...(editedQuestion.options || [])];
                                    newOptions[idx] = e.target.value;
                                    handleChange("options", newOptions);
                                }}
                                className="border p-1 rounded w-full"
                            />
                        ))
                    ) : (
                        question.options?.map((option, idx) => (
                            <li key={idx} className="p-2 border rounded">{option}</li>
                        ))
                    )}
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
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedQuestion.correctAnswer}
                            onChange={(e) => handleChange("correctAnswer", e.target.value)}
                            className="border p-1 rounded w-full"
                        />
                    ) : (
                        <p><strong>Answer:</strong> {question.correctAnswer}</p>
                    )}
                </div>
            )}

            <div className="absolute bottom-2 right-2">
                {isEditing ? (
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSave}
                            className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setEditedQuestion(question);
                                setIsEditing(false);
                            }}
                            className="bg-gray-500 text-white px-3 py-1 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-black px-3 py-1 rounded flex items-center space-x-2"
                    >
                        <PencilIcon className="w-5 h-5" /> <span>Edit</span>
                    </button>
                )}
            </div>
        </div>
    );
}
