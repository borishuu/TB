'use client';

import { useRouter } from 'next/navigation';
import { Eval } from '@/types';
import EvalMenu from '@/components/EvalMenu';

interface EvalCardProps {
  evaluation: Eval;
  onDelete: () => void;
  onDuplicate: (newEval: Eval) => void;
}

export default function EvalCard({ evaluation, onDelete, onDuplicate }: EvalCardProps) {
  const router = useRouter();
  const questionCount = Array.isArray(evaluation.content.content) ? evaluation.content.content.length : 0;

  const handleDelete = async () => {
    const response = await fetch(`/api/eval/${evaluation.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const { error } = await response.json();
      console.log(error || 'Failed to delete evaluation');
      return;
    }

    // Update local state in parent
    onDelete();
  };

  const handleDuplicate = async () => {
    const response = await fetch(`/api/eval/${evaluation.id}/duplicate`, {
      method: 'POST',
    });

    if (!response.ok) {
      const { error } = await response.json();
      console.log(error || 'Failed to duplicate evaluation');
      return;
    }

    const newEval: Eval = await response.json();

    // Add to local state in parent
    onDuplicate(newEval);
  };

  return (
    <div className="relative bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition">
      <div className="absolute top-2 right-2">
        <EvalMenu onDelete={handleDelete} onDuplicate={handleDuplicate} />
      </div>
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
