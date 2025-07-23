'use client';

import React from 'react';
import FileWithCheckbox from '@/components/FileWithCheckbox';
import BaseFileCard from '@/components/BaseFileCard';

interface FileDropZoneProps {
  title: string;
  description: string;
  files: any[];
  variant: 'checkbox' | 'simple';
  onDelete: (index: number) => void;
  onCheckboxChange?: (index: number) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onBrowseClick?: () => void;
  browseLabel?: string;
  showFindButton?: boolean;
  onFindClick?: () => void;
  findButtonLabel?: string;
  borderActive?: boolean;
}

export default function FileDropZone({
  title,
  description,
  files,
  variant,
  onDelete,
  onCheckboxChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onBrowseClick,
  browseLabel = 'parcourir',
  showFindButton = false,
  onFindClick,
  findButtonLabel = 'Chercher fichiers correspondants',
  borderActive = false,
}: FileDropZoneProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">{title}</label>

      {showFindButton && onFindClick && (
        <button type="button" onClick={onFindClick} className="button mb-4">
          {findButtonLabel}
        </button>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          borderActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } transition-all`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="text-gray-500">
          {description}{' '}
          {onBrowseClick && (
            <span
              className="text-blue-600 underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onBrowseClick();
              }}
            >
              {browseLabel}
            </span>
          )}
        </p>

        {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
                {files.map((file, index) => (
                <div key={file.id || index} className="relative">
                    {variant === 'checkbox' ? (
                        <FileWithCheckbox
                            file={file}
                            onDelete={() => onDelete(index)}
                            onCheckboxChange={() => onCheckboxChange?.(index)}
                        />
                        ) : (
                        <BaseFileCard
                            file={file}
                            onDelete={() => onDelete(index)}
                        />
                        )
                    }
                </div>
                ))}
            </div>
            )}
      </div>
    </div>
  );
}
