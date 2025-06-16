'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';

interface Quiz {
    id: number;
    title: string;
    content: any;
}

export default function QuizDashboard() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await fetch('/api/user/quiz');
                if (response.ok) {
                    const data = await response.json();
                    setQuizzes(data);
                } else {
                    console.error('Failed to fetch quizzes');
                }
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-full mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Mes évaluations</h1>

            <div className="flex justify-between mb-4">
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Link href="/quiz/create" className="button">
                    + Nouveau
                </Link>
            </div>

            {loading ? (
                <p className="text-center">Loading quizzes...</p>
            ) : filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQuizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            ) : (
                <p className="text-center">No quizzes found.</p>
            )}
        </div>
    );
}
