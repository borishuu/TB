'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import FileWithCheckbox from '@/components/FileWithCheckbox';
import { LocalFile, PoolFile } from '@/types';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [suggestedFiles, setSuggestedFiles] = useState<PoolFile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localDragActive, setLocalDragActive] = useState(false);
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
      formData.append('difficulty', difficulty);      
      questionTypes.forEach((type) => formData.append('questionTypes', type));
      suggestedFiles.forEach((file) => formData.append('suggestedFileIds', String(file.id)));

      files.forEach((file) => formData.append('contentFiles', file.file));
      const fileMetadata = files.map((localFile, _) => ({
        name: localFile.file.name,
        contextType: localFile.contextType,
      }));      
      formData.append('contentFilesMeta', JSON.stringify(fileMetadata));

      const response = await fetch('/api/eval', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Quiz creation failed');
      }

      const data = await response.json();
      console.log(data);
      router.push(`/eval/${data}`);
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
    //setFiles((prev) => [...prev, ...Array.from(newFiles)]);
    const wrappedFiles: LocalFile[] = Array.from(newFiles).map((file) => ({
      file,
      contextType: 'course',
    }));
    setFiles((prev) => [...prev, ...wrappedFiles]);
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

  const changeLocalFileContextType = (index: number) => {
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, contextType: f.contextType === 'course' ? 'evalInspiration' : 'course' } : f
      )
    );
  };

  const changePoolFileContextType = (id: number) => {
    //setSuggestedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const toggleQuestionType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const questionTypeOptions = [
    'Écriture de code',
    'Compréhension de code',
    'QCM',
    'Question ouverte',
  ];

  return (
    <div className="relative flex items-center justify-center">
      <div className={`bg-white p-8 rounded-lg shadow-md w-full max-w-3xl transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-2xl font-bold text-center mb-6">Générer une évaluation</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
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

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sujets</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Indiquez les sujets à aborder (ex: récursivité, typage...)"
              rows={4}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulté globale</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="very_easy">Très facile</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
              <option value="very_hard">Très difficile</option>
            </select>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Types de questions</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {questionTypeOptions.map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={questionTypes.includes(type)}
                    onChange={() => toggleQuestionType(type)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Suggested Files */}
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
                      <FileWithCheckbox
                        file={file}
                        onDelete={() => removeSuggestedFile(file.id)}
                        onCheckboxChange={() => changePoolFileContextType(file.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Local Files */}
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
                      <FileWithCheckbox
                        file={{ id: index, fileName: file.file.name, course: {}, createdAt: '' }}
                        onDelete={() => removeFile(index)}
                        onCheckboxChange={() => changeLocalFileContextType(index)}
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

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
