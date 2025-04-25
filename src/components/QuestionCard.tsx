'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ParamValue } from 'next/dist/server/request/params';

interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

export default function QuestionCard({ baseQuestion, quizId }: { baseQuestion: Question, quizId: ParamValue }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [regenState, setRegentState] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [question, setQuestion] = useState<Question>(baseQuestion);
    const [editQuestion, setEditQuestion] = useState<Question>(baseQuestion);
    const [regenPrompt, setRegenPrompt] = useState('');

    const handleChange = (field: keyof Question, value: string | string[]) => {
        setEditQuestion(prev => ({ ...prev, [field]: value }));
    };

    const startEdit = () => {
        setEditQuestion(question);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/quiz/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ editQuestion })
            });
            if (!response.ok) {
                throw new Error('Failed to update question');
            }
            setQuestion(editQuestion);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving question:", error);
        }
    };

    const handleEditCancel = () => {
        setIsEditing(false);
    };

    const startRegenState = () => {
        setRegentState(true);
    }

    const handleRegenerate = async () => {
        try {
            setIsRegenerating(true);
            const response = await fetch(`/api/quiz/${quizId}/regenerate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: regenPrompt, questionNumber: question.number })
            });
            if (!response.ok) {
                throw new Error('Failed to regenerate question');
            }
            const newQuestion: Question = await response.json();
            console.log(newQuestion);
            setQuestion(newQuestion);
            setIsRegenerating(false);
        } catch (error) {
            console.error("Error regenerating question:", error);
            setIsRegenerating(false);
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 pb-10 border border-gray-200 hover:shadow-xl transition relative">
            <div className="flex justify-between">
                {isEditing ? (
                    <input
                        type="text"
                        value={editQuestion.questionText}
                        onChange={(e) => handleChange("questionText", e.target.value)}
                        className="border p-1 rounded w-full max-w-2xl"
                    />
                ) : (
                    <p className="font-semibold max-w-2xl">{question.number}. {question.questionText}</p>
                )}
                <p className="text-sm text-gray-500">Type: {question.questionType}</p>
            </div>

            {question.questionType === 'mcq' && (
                <ul className="mt-2 space-y-1">
                    {isEditing ? (
                        editQuestion.options?.map((option, idx) => (
                            <input
                                key={idx}
                                type="text"
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...(editQuestion.options || [])];
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
                            value={editQuestion.correctAnswer}
                            onChange={(e) => handleChange("correctAnswer", e.target.value)}
                            className="border p-1 rounded w-full"
                        />
                    ) : (
                        <p><strong>Answer:</strong> {question.correctAnswer}</p>
                    )}
                </div>
            )}

            {regenState && (
                <div className="mt-2">
                    <input 
                        type="text" 
                        placeholder="What would you like to imrprove?" 
                        value={regenPrompt} 
                        onChange={(e) => setRegenPrompt(e.target.value)} 
                        className="border p-1 rounded w-full"
                    />
                    <button 
                        onClick={handleRegenerate} 
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-2"
                        disabled={isRegenerating}
                    >
                        <ArrowPathIcon className="w-5 h-5" /> <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>
                </div>
            )}

            <div className="absolute bottom-2 right-2 flex space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded">Save</button>
                        <button onClick={handleEditCancel} className="bg-gray-500 text-white px-3 py-1 rounded">Cancel</button>
                    </>
                ) : (
                    <>
                        <button onClick={startEdit} className="text-black px-3 py-1 rounded flex items-center space-x-2">
                            <PencilIcon className="w-5 h-5" /> <span>Edit</span>
                        </button>                       
                    </>
                )}

                <button 
                    onClick={() => setRegentState(!regenState)}
                    className="text-black px-3 py-1 rounded flex items-center space-x-2"
                >
                    <ArrowPathIcon className="w-5 h-5" /> <span>Demand regeneration</span>
                </button>
            </div>
        </div>
    );
}
