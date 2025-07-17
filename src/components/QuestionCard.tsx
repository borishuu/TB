'use client';

import { useState } from 'react';
import { TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import { ComponentProps } from 'react';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ParamValue } from 'next/dist/server/request/params';
import remarkBreaks from 'remark-breaks';

interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

export default function QuestionCard({ baseQuestion, quizId, onNewVersion  }: { baseQuestion: Question, quizId: ParamValue, onNewVersion?: (version: any) => void }) {
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
            const response = await fetch(`/api/eval/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ editQuestion })
            });
            if (!response.ok) {
                throw new Error('Failed to update question');
            }
            const data = await response.json();
            const newVersion = data.newVersion;
            setQuestion(editQuestion);
            setIsEditing(false);
            if (onNewVersion) onNewVersion(newVersion);
        } catch (error) {
            console.error("Error saving question:", error);
        }
    };

    const handleEditCancel = () => {
        setIsEditing(false);
    };

    const startRegenState = () => {
        setRegentState(true);
    };

    const handleRegenerate = async () => {
        try {
            setIsRegenerating(true);
            const response = await fetch(`/api/eval/${quizId}/regenerate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: regenPrompt, questionNumber: question.number })
            });
            if (!response.ok) {
                throw new Error('Failed to regenerate question');
            }
            const newVersion = await response.json();
            //setQuestion(newQuestion);
            setIsRegenerating(false);
            if (onNewVersion) onNewVersion(newVersion.newVersion);
        } catch (error) {
            console.error("Error regenerating question:", error);
            setIsRegenerating(false);
        }
    };

    const renderers: Components = {
        code({ inline, className, children, ...props }: { 
            inline?: boolean; 
            className?: string; 
            children?: React.ReactNode 
          }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
      
          if (!inline && match) {
            return (
              <SyntaxHighlighter
                style={materialLight}
                language={match[1]}
                PreTag="div"
                customStyle={{ fontSize: '0.85em' }}
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            );
          }
      
          return (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
              {codeString}
            </code>
          );
        },
      
        p({ children, ...props }) {
          return <p className="mb-1 leading-tight" {...props}>{children}</p>;
        },
      
        ol({ children, ...props }) {
          return <ol className="list-decimal pl-6 mb-1 leading-tight" {...props}>{children}</ol>;
        },
      
        ul({ children, ...props }) {
          return <ul className="list-disc pl-6 mb-1 leading-tight" {...props}>{children}</ul>;
        },
      
        li({ children, ...props }) {
          return <li className="mb-0.5" {...props}>{children}</li>;
        },
      
        strong({ children, ...props }) {
          return <strong className="font-semibold" {...props}>{children}</strong>;
        }
      };

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 pb-10 border border-gray-200 hover:shadow-xl transition relative">
            <div className="flex justify-between items-start gap-4">
                {isEditing ? (
                    <textarea
                        value={editQuestion.questionText}
                        onChange={(e) => handleChange("questionText", e.target.value)}
                        className="border p-1 rounded w-full min-h-[240px]"
                    />
                ) : (
                    <div className="whitespace-pre-wrap break-words overflow-x-auto max-w-full">
                        <div className="font-semibold">
                            {`${question.number}.`}
                        </div>
                        <ReactMarkdown components={renderers} remarkPlugins={[remarkBreaks]}>
                            {question.questionText /* TODO fix sometimes code blocks not formatted correctly */}
                        </ReactMarkdown>
                    </div>
                )}
                <p className="text-sm text-gray-500 flex-shrink-0">Type: {question.questionType}</p>
            </div>

            {question.questionType === 'mcq' && (
                <ul className="mt-2 space-y-1">
                    {isEditing ? (
                        editQuestion.options?.map((option, idx) => (
                            <textarea
                                key={idx}
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...(editQuestion.options || [])];
                                    newOptions[idx] = e.target.value;
                                    handleChange("options", newOptions);
                                }}
                                className="border p-1 rounded w-full min-h-[60px]"
                            />
                        ))
                    ) : (
                        question.options?.map((option, idx) => (
                            <li
                                key={idx}
                                className="p-2 border rounded whitespace-pre-wrap break-words"
                            >
                                <ReactMarkdown components={renderers}>
                                    {option}
                                </ReactMarkdown>
                            </li>
                        ))
                    )}
                </ul>
            )}

            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 button"
            >
                {isExpanded ? "Masquer la réponse" : "Afficher la réponse"}
            </button>

            {isExpanded && (
                <div className="mt-2 bg-gray-100 p-3 rounded-lg">
                    {isEditing ? (
                        <textarea
                            value={editQuestion.correctAnswer}
                            onChange={(e) => handleChange("correctAnswer", e.target.value)}
                            className="border p-1 rounded w-full min-h-[60px]"
                        />
                    ) : (
                        <div className="whitespace-pre-wrap break-words">
                            <strong>Réponse :</strong>{" "}
                            <ReactMarkdown components={renderers} remarkPlugins={[remarkBreaks]}>
                                {question.correctAnswer}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}

            {regenState && (
                <div className="mt-2">
                    <input 
                        type="text" 
                        placeholder="Indiquez comment améliorer la question" 
                        value={regenPrompt} 
                        onChange={(e) => setRegenPrompt(e.target.value)} 
                        className="border p-1 rounded w-full"
                    />
                    <button 
                        onClick={handleRegenerate} 
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center space-x-2 mt-2"
                        disabled={isRegenerating}
                    >
                        <ArrowPathIcon className="w-5 h-5" /> 
                        <span>{isRegenerating ? 'Regénération...' : 'Regénérer'}</span>
                    </button>
                </div>
            )}

            <div className="absolute bottom-2 right-2 flex space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded">Enregistrer</button>
                        <button onClick={handleEditCancel} className="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                    </>
                ) : (
                    <>
                        <button onClick={startEdit} className="text-black px-3 py-1 rounded flex items-center space-x-2">
                            <PencilIcon className="w-5 h-5" /> <span>Modifier</span>
                        </button>                       
                    </>
                )}

                <button 
                    onClick={() => setRegentState(!regenState)}
                    className="text-black px-3 py-1 rounded flex items-center space-x-2"
                >
                    <ArrowPathIcon className="w-5 h-5" /> <span>Demander regénération</span>
                </button>
            </div>
        </div>
    );
}
