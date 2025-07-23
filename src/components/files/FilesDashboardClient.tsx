'use client';

import { useState } from 'react';
import File from '@/components/File';
import UploadForm from '@/components/forms/UploadForm';
import { PoolFile, Course } from '@/types';

interface FilesDashboardClientProps {
  files: PoolFile[];
  courses: Course[];
}

export default function FilesDashboardClient({ files: initialFiles, courses }: FilesDashboardClientProps) {
  const [files, setFiles] = useState(initialFiles);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  const groupedFiles = files.reduce<Record<string, PoolFile[]>>((acc, file) => {
    const courseName = (file.course as any).courseName;
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(file);
    return acc;
  }, {});

  const handleDeleteFile = async (id: number) => {
    try {
      const res = await fetch(`/api/file/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Failed to delete file');
        return;
      }

      // Remove the file from the state
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="relative max-w-full mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Mes Fichiers</h1>

      <div className="text-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="button"
        >
          Ajouter des fichiers
        </button>
      </div>

      <div className="mt-6">
        {Object.keys(groupedFiles).length > 0 ? (
          Object.entries(groupedFiles).map(([course, courseFiles]) => (
            <div key={course} className="pt-4">
              <div
                className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
                onClick={() => setExpandedCourses((prev) => ({
                  ...prev,
                  [course]: !prev[course],
                }))}
              >
                <h2 className="text-lg font-semibold">{course}</h2>
                <span className="text-sm text-gray-500">
                  {expandedCourses[course] ? '▲' : '▼'}
                </span>
              </div>
              {expandedCourses[course] && (
                <div className="flex flex-wrap gap-4 mt-3 px-2">
                  {courseFiles.map((file) => (
                    <File key={file.id} file={file} onDelete={handleDeleteFile} />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center mt-4">Aucun fichier trouvé.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <UploadForm
            onClose={() => setShowModal(false)}
            onSuccess={(newFiles: PoolFile[]) => setFiles((prev) => [...prev, ...newFiles])}
            courses={courses}
          />
        </div>
      )}
    </div>
  );
}
