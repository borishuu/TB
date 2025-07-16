'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseFileCard from '@/components/BaseFileCard';
import CourseDropdown from '@/components/CourseDropdown';
import { Course } from '@/types';

export default function ImportEvalForm({ courses }: { courses: Course[] }) {
  const [title, setTitle] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [titleDisabled, setTitleDisabled] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localDragActive, setLocalDragActive] = useState(false);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses || []);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>(0);
  const [newCourseName, setNewCourseName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const localInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('courseId', String(selectedCourse || ''));
      if (importFile) {
        formData.append('content', fileContent);
      }

      const response = await fetch('/api/eval/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Création de l\'évaluation a échoué');
      }

      const data = await response.json();
      console.log(data);
      router.push(`/eval/${data}`);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLocalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDragActive(true);
  };

  const handleLocalDragLeave = () => {
    setLocalDragActive(false);
  };

  const handleFileRead = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.title || !json.content) {
        setError('Le fichier JSON doit contenir un champ "title" et "content"');
        return;
      }

      setTitle(json.title);
      setTitleDisabled(false);

      const wrappedContent = { content: json.content };
      setFileContent(JSON.stringify(wrappedContent));
      
      setError('');
    } catch (err) {
      setError('Le fichier JSON est invalide ou mal formé');
      console.error(err);
    }
  };

  const handleLocalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Le fichier doit être au format JSON');
      return;
    }

    setImportFile(file);
    handleFileRead(file);
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Le fichier doit être au format JSON');
      if (localInputRef.current) localInputRef.current.value = '';
      return;
    }

    setImportFile(file);
    handleFileRead(file);
  };

  const removeFile = () => {
    setImportFile(null);
    setTitle('');
    setTitleDisabled(true);
    if (localInputRef.current) localInputRef.current.value = '';
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`bg-white p-8 rounded-lg shadow-md w-full max-w-3xl transition-opacity duration-300 ${
          loading ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-6">Importer une évaluation</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              type="text"
              disabled={titleDisabled}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Titre de l'évaluation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier local</label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center ${
                localDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } transition-all`}
              onDragOver={handleLocalDragOver}
              onDragLeave={handleLocalDragLeave}
              onDrop={handleLocalDrop}
            >
              <input
                ref={localInputRef}
                type="file"
                className="hidden"
                onChange={handleLocalFileChange}
              />
              <p className="text-gray-500">
                Glissez-déposez le fichier ici, ou{' '}
                <span
                  className="text-blue-600 underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    localInputRef.current?.click();
                  }}
                >
                  parcourir
                </span>
              </p>
              {importFile && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="relative">
                    <BaseFileCard
                      file={{ id: 1, fileName: importFile.name, course: {}, createdAt: '' }}
                      onDelete={removeFile}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full button"
            disabled={loading || !title || selectedCourse === '' || selectedCourse === 0 || !importFile}
          >
            {loading ? 'Importation...' : 'Importer'}
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
