'use client';

import { useRouter } from 'next/navigation';

// TODO: global type definition
interface Quiz {
    id: number;
    title: string;
    content: any; // JSON content (array of questions)
}

export default function QuizCard({ quiz }: { quiz: Quiz }) {
    const router = useRouter();
    const questionCount = Array.isArray(quiz.content.content) ? quiz.content.content.length : 0;

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition">
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            <p className="text-gray-500">Questions: {questionCount}</p>
            <button
                className="mt-3 button"
                onClick={() => router.push(`/quiz/${quiz.id}`)}
            >
                View Quiz
            </button>
        </div>
    );
}
