'use client';

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { useState, useRef, useEffect } from 'react';

interface EvalMenuProps {
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function EvalMenu({ onDelete, onDuplicate }: EvalMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-gray-200"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-md rounded-md z-10">
          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Supprimer
          </button>
          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            Dupliquer
          </button>
        </div>
      )}
    </div>
  );
}
