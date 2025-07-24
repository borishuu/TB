'use client';

import { useRef, useState } from 'react';
import { Course } from '@/types';
import CourseDropdown from '@/components/CourseDropdown';
import FileDropZone from '@/components/files/FileDropZone';

interface UploadFormProps {
  onClose: () => void;
  onSuccess: (newFiles: any[]) => void;
  courses: Course[];
}

export default function UploadForm({ onClose, onSuccess, courses }: UploadFormProps) {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [newCourseName, setNewCourseName] = useState('');
  const [localCourses, setLocalCourses] = useState<Course[]>(courses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!uploadFiles.length || !selectedCourse) {
      setError('Veuillez sélectionner un cours et ajouter des fichiers.');
      setLoading(false);
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Échec de l'upload des fichiers.");
      }

      const updatedFiles = await res.json();
      onSuccess(updatedFiles);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
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
    <div className="relative flex items-center justify-center">
      <div
        className={`bg-white p-8 rounded-lg shadow-md w-full max-w-3xl transition-opacity duration-300 ${
          loading ? 'pointer-events-none' : ''
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-center mb-6">Uploader des fichiers</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
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
              variant="simple"
              onDelete={removeFile}
              onCheckboxChange={() => {}}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
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
          </div>

          <button
            type="submit"
            className="w-full button"
            disabled={loading || !selectedCourse || uploadFiles.length === 0}
          >
            {loading ? 'Upload en cours...' : 'Uploader'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
