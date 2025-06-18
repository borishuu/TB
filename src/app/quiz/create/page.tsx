'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      console.log(data);
  }

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fichiers de contexte</label>
            <button
              type="button"
              onClick={() => handleFindCorrespondingFiles()}
              className="button mb-2"
            >
              Chercher fichiers correspondants
            </button>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } transition-all`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-gray-500">
                Glissez-déposez des fichiers ici, ou <span className="text-blue-600 underline">parcourir</span>
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-2">
              <ul className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm text-gray-800">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
