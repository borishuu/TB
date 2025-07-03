import { TrashIcon } from '@heroicons/react/24/solid';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { PoolFile } from '@/types';

interface BaseFileCardProps {
  file: PoolFile;
  onDelete?: (id: number) => void;
  children?: React.ReactNode;
}

export default function BaseFileCard({ file, onDelete, children }: BaseFileCardProps) {
  return (
    <div
      className="relative w-30 h-30 p-1 hover:shadow-lg transition flex flex-col items-center justify-center bg-white text-center"
      title={file.fileName}
    >
      <button
        type="button"
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
        onClick={() => onDelete?.(file.id)}
      >
        <TrashIcon className="w-5 h-5" />
      </button>

      <DocumentTextIcon className="w-12 h-12 text-gray-400 mb-2" />

      <span
        className="text-sm font-medium max-w-[100px] truncate text-center"
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
      >
        {file.fileName}
      </span>

      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
