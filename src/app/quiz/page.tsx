'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// TODO: Put all types in type file
interface Quiz {
    id: string;
    title: string;
}

export default function QuizDashboard() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                //const response = await fetch('/api/quiz');
                //const data = await response.json();
                //setQuizzes(data);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, []);

    const filteredQuizzes = quizzes.filter(quiz => quiz.title.toLowerCase().includes(search.toLowerCase()));

    return (
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-4">Quiz Dashboard</h1>

                <div className="flex justify-between mb-4">
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <Link href="/quiz/create" className="button">+ Create Quiz</Link>
                </div>

                {loading ? (
                    <p className="text-center">Loading quizzes...</p>
                ) : (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Title</th>
                                <th className="border p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuizzes.length > 0 ? (
                                filteredQuizzes.map((quiz) => (
                                    <tr key={quiz.id} className="text-center">
                                        <td className="border p-2">{quiz.title}</td>
                                        <td className="border p-2">
                                            <Link href={`/quiz/${quiz.id}`} className="text-blue-600 underline">View</Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center p-4">No quizzes found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
    );
}
