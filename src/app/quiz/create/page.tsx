'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import File from '@/components/File';

interface SuggestedFile {
  id: number;
  fileName: string;
  course: object;
  createdAt: string;
  filePath?: string;
}

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [suggestedFiles, setSuggestedFiles] = useState<SuggestedFile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localDragActive, setLocalDragActive] = useState(false);
  const poolInputRef = useRef<HTMLInputElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('topics', topics);
      files.forEach((file) => formData.append('contentFiles', file));
      suggestedFiles.forEach((file) =>
        formData.append('suggestedFileIds', String(file.id))
      );

      const response = await fetch('/api/quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Quiz creation failed');
      }

      const data = await response.json();
      console.log(data);
      // router.push('/quiz');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindCorrespondingFiles = async () => {
    const formData = new FormData();
    formData.append('topics', topics);

    const response = await fetch('/api/file/similarity', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to find corresponding files');
    }

    const data = await response.json();
    setSuggestedFiles(data.files);
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  const handleLocalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDragActive(true);
  };

  const handleLocalDragLeave = () => {
    setLocalDragActive(false);
  };

  const handleLocalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLocalDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (localInputRef.current) localInputRef.current.value = '';
  };

  const removeSuggestedFile = (id: number) => {
    setSuggestedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-6">Générer une évaluation</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de l'évaluation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sujets</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Indiquez les sujets à aborder (ex: récursivité, typage, etc.)"
              rows={4}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>

          {/* Files pool upload section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fichiers depuis mon pool</label>
            <button
              type="button"
              onClick={handleFindCorrespondingFiles}
              className="button mb-4"
            >
              Chercher fichiers correspondants
            </button>
            <div className="border-2 border-dashed rounded-lg p-4 text-center border-gray-300">
              <p className="text-gray-500">
                Recherche automatique depuis les sujets donnés, ou{' '}
                <span className="text-blue-600 underline cursor-pointer">parcourir</span>
              </p>
              {suggestedFiles.length > 0 && (                
                <div className="mt-4 flex flex-wrap gap-3">
                  {suggestedFiles.map((file) => (
                    <div key={file.id} className="relative">
                      <File
                        file={file}
                        onDelete={() => removeSuggestedFile(file.id)}
                      />
                    </div>
                  ))}
                </div>                
              )}
            </div>
            
          </div>

          {/* Local file upload section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fichiers locaux</label>
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
                multiple
                className="hidden"
                onChange={handleLocalFileChange}
              />
              <p className="text-gray-500">
                Glissez-déposez des fichiers ici, ou{' '}
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

              {files.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="relative">
                      <File
                        file={{ id: index, fileName: file.name, course: {}, createdAt: '' }}
                        onDelete={() => removeFile(index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full button"
            disabled={loading}
          >
            {loading ? 'Génération...' : 'Générer'}
          </button>
        </form>
      </div>
    </div>
  );
}
