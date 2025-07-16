'use client';

import { useState } from 'react';
import { Course } from '@/types';

interface CourseDropdownProps {
  courses: Course[];
  value: number | '';
  newCourseName: string;
  onChange: (value: number | '', newCourseName: string) => void;
  setCourses: (courses: Course[]) => void;
}

export default function CourseDropdown({
  courses,
  value,
  newCourseName,
  onChange,
  setCourses,
}: CourseDropdownProps) {
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'new') {
      setIsNew(true);
      onChange('', '');
    } else {
      setIsNew(false);
      onChange(Number(selected), '');
    }
  };

  const handleNewCourseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('', e.target.value);
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName.trim() }),
      });

      if (!res.ok) {
        console.error('Failed to create course');
        return;
      }

      const newCourse: Course = await res.json();

      setCourses([...courses, newCourse]);

      setIsNew(false);
      onChange(newCourse.id, '');

    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Cours</label>
      <select
        value={isNew ? 'new' : value}
        onChange={handleSelectChange}
        className="w-full border rounded px-3 py-2"
      >
        <option value="0">Sélectionner un cours</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.courseName}
          </option>
        ))}
        <option value="new">+ Nouveau cours</option>
      </select>

      {isNew && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newCourseName}
            onChange={handleNewCourseChange}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Entrez le nom du nouveau cours"
          />
          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={loading}
            className="button"
          >
            {loading ? '...' : 'Créer'}
          </button>
        </div>
      )}
    </div>
  );
}
