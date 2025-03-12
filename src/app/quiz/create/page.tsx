'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      files.forEach((file) => formData.append('contentFiles', file));

      const response = await fetch('/api/quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Quiz creation failed');
      }

      const data = await response.json()

      console.log(data);

      //router.push('/quiz');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Generate Quiz</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Files</label>
            <button
              type="button"
              className="button"
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              Upload File
            </button>
            <input
              id="fileInput"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
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
                      Remove
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
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>
    </div>
  );
}
