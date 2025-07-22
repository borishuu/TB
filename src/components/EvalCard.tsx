'use client';

import { useRouter } from 'next/navigation';
import { Eval } from '@/types';
import EvalMenu from '@/components/EvalMenu';

interface EvalCardProps {
  evaluation: Eval;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: (newEval: Eval) => void;
}

export default function EvalCard({ evaluation, onEdit, onDelete, onDuplicate }: EvalCardProps) {
  const router = useRouter();
  const questionCount = Array.isArray(evaluation.currentVersion?.content.content) ? evaluation.currentVersion?.content.content.length : 0;

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

  const handleDownload = async () => {
    try {
      const content = evaluation.currentVersion?.content;
  
      if (!content) {
        console.error("No evaluation content found to download");
        return;
      }
  
      const exportObj = {
        title: evaluation.title,
        content: content.content,
      };
  
      const jsonStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${evaluation.title || 'evaluation'}.json`;
      document.body.appendChild(link);
      link.click();
  
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download evaluation:", error);
    }
  };
  

  return (
    <div className="relative bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition">
      <div className="absolute top-2 right-2">
        <EvalMenu onEdit={onEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} onDownload={handleDownload} />
      </div>
      <h2 className="text-xl font-semibold">{evaluation.title}</h2>
      <p className="text-gray-400 text-sm">{(evaluation.course as any).courseName}</p>
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
