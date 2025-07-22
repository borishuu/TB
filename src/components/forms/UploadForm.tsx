'use client';

import { useRef, useState } from 'react';
import { Course } from '@/types';
import CourseDropdown from '@/components/CourseDropdown';
import FileDropZone from '@/components/FileDropZone';
import BaseFileCard from '@/components/BaseFileCard';

interface UploadFormProps {
  onClose: () => void;
  onSuccess: (newFiles: any[]) => void;
  courses: Course[];
}

export default function UploadForm({ onClose, onSuccess, courses }: UploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [newCourseName, setNewCourseName] = useState('');
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);

  const handleFilesUpload = async () => {
    if (!uploadFiles.length || !selectedCourse) {
      console.error('Please select a course and add files');
      return;
    }

    const formData = new FormData();
    uploadFiles.forEach((file) => formData.append('files', file));
    formData.append('courseId', String(selectedCourse));

    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const updatedFiles = await res.json();
        onSuccess(updatedFiles);
        onClose();
      } else {
        console.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">Uploader un fichier</h2>

      <div className="mb-4">
        <CourseDropdown
          courses={localCourses}
          value={selectedCourse}
          newCourseName={newCourseName}
          onChange={(selected, newName) => {
            setSelectedCourse(selected);
            setNewCourseName(newName);
          }}
          setCourses={setLocalCourses}
        />
      </div>

      <FileDropZone
        title="Fichiers"
        description="Glissez-déposez des fichiers ici, ou"
        files={uploadFiles.map((file, index) => ({
          id: index,
          fileName: file.name,
          course: {},
          createdAt: '',
          contextType: 'course',
        }))}
        variant='simple'
        onDelete={removeFile}
        onCheckboxChange={() => {}}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onBrowseClick={() => inputRef.current?.click()}
        borderActive={dragActive}
      />
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="text-right mt-2">
        <button
          onClick={handleFilesUpload}
          className="button"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
