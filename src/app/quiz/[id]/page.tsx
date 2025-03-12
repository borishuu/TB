'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';

interface Question {
    number: string;
    questionText: string;
    questionType: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
}

interface Quiz {
    id: string;
    title: string;
    content: { content: Question[] };
}

export default function QuizPage() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`/api/quiz/${id}`);
                if (!response.ok) throw new Error('Failed to fetch quiz');
                const data = await response.json();
                setQuiz(data);
            } catch (error) {
                console.error('Error fetching quiz:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchQuiz();
    }, [id]);

    if (loading) return <p className="text-center">Loading quiz...</p>;
    if (!quiz) return <p className="text-center text-red-600">Quiz not found.</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-center mb-4">{quiz.title}</h1>
            <div className="space-y-6">
                {quiz.content.content.map((question, index) => (
                    <QuestionCard key={index} question={question} />
                ))}
            </div>
        </div>
    );
}
