'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { useRef, useState } from 'react';
import CourseDropdown from '@/components/CourseDropdown';
import FileDropZone from '@/components/files/FileDropZone';
import { LocalFile, PoolFile, Course } from '@/types';

interface CreateEvalFormProps {
  courses: Course[];
  onClose: () => void;
  onSuccess: (evalId: number) => void;
}

export default function CreateEvalForm({ courses, onClose, onSuccess }: CreateEvalFormProps) {
  const [title, setTitle] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [suggestedFiles, setSuggestedFiles] = useState<PoolFile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localDragActive, setLocalDragActive] = useState(false);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses || []);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [newCourseName, setNewCourseName] = useState('');
  const [allPoolFiles, setAllPoolFiles] = useState<PoolFile[]>([]);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const localInputRef = useRef<HTMLInputElement>(null);

  /*const [modelKey, setModelKey] = useState('gemini 2.5 flash');
  const [prompts, setPrompts] = useState('');*/  

  /*const models: Record<string, { model: string; prompts: { value: string; label: string }[] }>  = {
    'gemini 2.5 flash': {
      model: 'models/gemini-2.5-flash',
      prompts: [
        { value: 'v1', label: 'v1 - standard' },
        { value: 'v2', label: 'v2 - extraction contenu -> génération éval + inspiration' },
        { value: 'v3', label: 'v3 - pas de copies d\'exercices d\'inspiration' },
      ],
    },
    'codestral': {
      model: 'codestral-2501',
      prompts: [
        { value: 'v1', label: 'v1 - standard (extraction contenu -> génération éval)' },
        { value: 'v2', label: 'v2 - instructions dans system prompts' },
        { value: 'v3', label: 'v3 - extraction -> génération plan -> génération éval' },
        { value: 'v4', label: 'v4 - v3 avec one-shot prompting' },
        { value: 'v5', label: 'v5 - v4 avec CoT' },
        { value: 'v6', label: 'v6 - extraction -> plan -> éval -> corrections' },
      ],
    },
  };*/
  
  const questionTypeOptions = [
    'Écriture de code',
    'Compréhension de code',
    'QCM',
    'Question ouverte',
  ];


  //const availablePrompts = models[modelKey]?.prompts || [];
  //const model = models[modelKey]?.model || '';
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/eval/generation/start', { method: 'POST' });
      const { generationId } = await res.json();

      const sse = new EventSource(`/api/eval/generation/progress?id=${generationId}`);
      sse.onmessage = (event) => {
        const { phase } = JSON.parse(event.data);
        setPhase(phase);
        console.log("Phase:", phase);
      };


      const formData = new FormData();
      formData.append('title', title);
      formData.append('difficulty', difficulty);
      formData.append('questionCount', String(questionCount));
      //formData.append('model', model);
      formData.append('model', 'models/gemini-2.5-flash');      
      //formData.append('prompts', prompts);
      formData.append('prompts', 'v3');
      formData.append('courseId', String(selectedCourse || ''));
      formData.append('generationId', generationId)
      topics.forEach((topic) => formData.append('topics', topic));
      questionTypes.forEach((type) => formData.append('questionTypes', type));
      suggestedFiles.forEach((file) => formData.append('suggestedFileIds', String(file.id)));
      files.forEach((file) => formData.append('contentFiles', file.file));

      const fileMetadata = files.map((localFile) => ({
        name: localFile.file.name,
        contextType: localFile.contextType,
      }));
      formData.append('contentFilesMeta', JSON.stringify(fileMetadata));

      const poolFileMetadata = suggestedFiles.map((poolFile) => ({
        name: poolFile.fileName,
        contextType: poolFile.contextType,
      }));
      formData.append('poolFilesMeta', JSON.stringify(poolFileMetadata));

      const response = await fetch('/api/eval', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ||'Création de l\'évaluation a échoué');
      }

      const data = await response.json();
      onSuccess(data);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    } finally {
      //setLoading(false);
    }
  };

  const handleFindCorrespondingFiles = async () => {
    const formData = new FormData();
    topics.forEach((topic) => formData.append('topics', topic));

    const response = await fetch('/api/file/similarity', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to find corresponding files');
    }

    const data = await response.json();
    const filesWithContext = data.files.map((file: PoolFile) => ({
      ...file,
      contextType: 'course',
    }));
    setSuggestedFiles(filesWithContext);
  };

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
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

  const changePoolFileContextType = (index: number) => {
    setSuggestedFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, contextType: f.contextType === 'course' ? 'evalInspiration' : 'course' } : f
      )
    );
  };

  const toggleQuestionType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addTopic = () => {
    const newTopic = topicInput.trim();
    if (newTopic && !topics.includes(newTopic)) {
      setTopics([...topics, newTopic]);
    }
    setTopicInput('');
  };

  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic();
    }
  };

  const handleBrowsePoolFiles = async () => {
    try {
      const response = await fetch('/api/file');
      if (!response.ok) throw new Error('Erreur lors du chargement des fichiers');
      const data = await response.json();
      setAllPoolFiles(data);
      setShowPoolModal(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <div className={`bg-white p-8 rounded-lg shadow-md w-full max-w-3xl max-h-[90vh] overflow-y-auto transition-opacity duration-300 ${loading ? 'pointer-events-none' : ''}`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
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

          <div className="flex gap-4">
            {/* Difficulty */}
            <div className="w-1/2">
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

            {/* Question Count */}
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">Nombre de questions</label>
              <input
                type="number"
                min={1}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de questions à générer"
              />
            </div>
          </div>



          {/* LLM Model */}
          {/*<div>
            <label className="block text-sm font-medium text-gray-700">Modèle LLM</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={modelKey}
              onChange={(e) => {
                setModelKey(e.target.value);
                setPrompts('');
              }}
            >
              {Object.keys(models).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>)
              )}

            </select>
          </div>*/}

          {/* Prompting */}
          {/*<div>
            <label className="block text-sm font-medium text-gray-700">Version des prompts</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              disabled={availablePrompts.length === 0}
            >
              <option value="">Sélectionnez un type de prompt</option>
              {availablePrompts.map((prompt) => (
                <option key={prompt.value} value={prompt.value}>
                  {prompt.label}
                </option>
              ))}
            </select>
          </div>*/}

          {/* Question Types */}
          {<div>
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
          </div>}

          {/* Course */}
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

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sujets</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={() => removeTopic(topic)}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex mt-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ajouter un sujet et appuyer sur Entrée"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={addTopic}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Suggested Files */}
          <FileDropZone
            title="Fichiers depuis mon pool"
            description="Recherche automatique depuis les sujets donnés, ou"
            files={suggestedFiles}
            variant='checkbox'
            onDelete={(index) => removeSuggestedFile(suggestedFiles[index].id)}
            onCheckboxChange={changePoolFileContextType}
            showFindButton
            onFindClick={handleFindCorrespondingFiles}
            onBrowseClick={handleBrowsePoolFiles}
          />


          {/* Local Files */}
          <input
            type="file"
            multiple
            ref={localInputRef}
            onChange={handleLocalFileChange}
            className="hidden"
          />
          <FileDropZone
            title="Fichiers locaux"
            description="Glissez-déposez des fichiers ici, ou"
            files={files.map((file, index) => ({
              id: index,
              fileName: file.file.name,
              course: {},
              createdAt: '',
              contextType: 'course',
            }))}
            variant='checkbox'
            onDelete={removeFile}
            onCheckboxChange={changeLocalFileContextType}
            onDrop={handleLocalDrop}
            onDragOver={handleLocalDragOver}
            onDragLeave={handleLocalDragLeave}
            onBrowseClick={() => localInputRef.current?.click()}
            borderActive={localDragActive}
          />

          <button
            type="submit"
            className="w-full button"
            disabled={loading || !selectedCourse || !title || questionTypes.length === 0 || (files.length === 0 && suggestedFiles.length === 0)}
          >
            {loading ? 'Génération...' : 'Générer'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 text-xl font-bold text-center">
              {phase === 'context' && 'Extraction du contexte...'}
              {phase === 'evaluation' && 'Génération de l\'évaluation...'}
              {!phase && 'Préparation...'}
            </p>
          </div>
        </div>
      )}


      {showPoolModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh]">
            <h3 className="text-xl font-bold mb-4">Sélectionner des fichiers de mon pool</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPoolFiles.map((file) => (
                <div key={file.id} className="border p-2 rounded flex items-center justify-between">
                  <span className="truncate">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!suggestedFiles.some(f => f.id === file.id)) {
                        setSuggestedFiles((prev) => [...prev, {...file, contextType: 'course' }]);
                      }
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowPoolModal(false)}
                className="button"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
