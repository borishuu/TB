'use client';

import { useEffect, useState, useRef } from 'react';
import File from '@/components/File';
import UploadForm from '@/components/UploadForm';

interface File {
  id: number;
  fileName: string;
  course: object;
  createdAt: string;
}

export default function FilesDashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/user/files');
        if (response.ok) {
          const data = await response.json();
          setFiles(data);
        } else {
          console.error('Failed to fetch files');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const groupedFiles = files.reduce<Record<string, File[]>>((acc, file) => {
    if (!acc[(file.course as any).courseName]) acc[(file.course as any).courseName] = [];
    acc[(file.course as any).courseName].push(file);
    return acc;
  }, {});

  return (
    <div className="relative max-w-full mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Mes Fichiers</h1>

      <div className="text-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="button"
        >
          Ajouter un fichier
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-center">Chargement des fichiers...</p>
        ) : Object.keys(groupedFiles).length > 0 ? (
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
                    <File key={file.id} file={file} />
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
                onSuccess={(newFiles: File[]) => setFiles(newFiles)}
                />
        </div>
      )}
    </div>
  );
}
