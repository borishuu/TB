'use client';

import { useRouter } from 'next/navigation';
import { Eval } from '@/types';

export default function EvalCard({ evaluation }: { evaluation: Eval }) {
    const router = useRouter();
    const questionCount = Array.isArray(evaluation.content.content) ? evaluation.content.content.length : 0;

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition">
            <h2 className="text-xl font-semibold">{evaluation.title}</h2>
            <p className="text-gray-500">Questions: {questionCount}</p>
            <button
                className="mt-3 button"
                onClick={() => router.push(`/eval/${evaluation.id}`)}
            >
                Afficher
            </button>
        </div>
    );
}
