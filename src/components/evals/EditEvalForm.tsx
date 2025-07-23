'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CourseDropdown from '@/components/CourseDropdown';
import { Course, Eval } from '@/types';

interface EditEvalFormProps {
  onClose: () => void;
  onSuccess: (newEval: Eval) => void;
  evaluation: Eval;
  courses: Course[];
}

export default function EditEvalForm({ onClose, onSuccess, evaluation, courses }: EditEvalFormProps) {
  const [title, setTitle] = useState(evaluation.title || '');
  const [selectedCourse, setSelectedCourse] = useState<number | ''>((evaluation.course as any).id || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses || []);
  const [newCourseName, setNewCourseName] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('courseId', String(selectedCourse || ''));

      const response = await fetch(`/api/eval/${evaluation.id}/question`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Modification de l\'évaluation a échoué');
      }

      const data = await response.json();
      onSuccess(data);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`bg-white rounded-lg p-6 w-full shadow-xl relative ${
          loading ? 'pointer-events-none' : ''
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-center mb-6">Modifier l'évaluation</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              type="text"
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

          <button
            type="submit"
            className="w-full button"
            disabled={loading || !title || selectedCourse === '' || selectedCourse === 0}
          >
            {loading ? 'Enregistrement...' : 'Enregister'}
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
