'use client';

import { TrashIcon } from '@heroicons/react/24/solid';
import { DocumentIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface File {
  id: number;
  fileName: string;
  course: string;
  createdAt: string; 
}

export default function File({ file, onDelete }: { file: File; onDelete?: (id: number) => void }) {
  const router = useRouter();

  return (
    <div className="relative w-30 h-30 p-1 hover:shadow-lg transition flex flex-col items-center justify-center bg-white text-center">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
        onClick={() => onDelete?.(file.id)}
      >
        <TrashIcon className="w-5 h-5" />
      </button>

      <DocumentTextIcon className="w-12 h-12 text-gray-400 mb-2" />

      <span className="text-sm font-medium break-words">{file.fileName}</span>
    </div>
  );
}
