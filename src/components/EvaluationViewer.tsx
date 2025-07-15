'use client';

import { useState, useMemo, useEffect  } from 'react';
import QuestionCard from '@/components/QuestionCard';
import { Eval } from '@/types';

interface EvaluationViewerProps {
  quizId: string;
  evaluation: Eval;
}

export default function EvaluationViewer({ evaluation, quizId }: EvaluationViewerProps) {
  const [versions, setVersions] = useState(evaluation.versions);
  const [selectedVersionId, setSelectedVersionId] = useState(evaluation.currentVersion?.id);

  const handleNewVersion = (newVersion: any) => {
    setVersions((prev) => [newVersion, ...prev]);
    setSelectedVersionId(newVersion.id);
  };

  const selectedVersion = useMemo(() => {
    return (
      versions.find((v) => v.id === selectedVersionId) || evaluation.currentVersion
    );
  }, [selectedVersionId, evaluation.versions]);

  useEffect(() => {
    console.log("Selected version:", selectedVersion);
    console.log("Selected version content:", selectedVersion?.content);
  }, [selectedVersion]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{evaluation.title}</h1>
        <div className="flex items-center space-x-2">
          <label htmlFor="version-select" className="text-sm font-medium text-gray-700">
            Historique:
          </label>
          <select
            id="version-select"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(Number(e.target.value))}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {`v${version.versionInfo?.versionNumber} - ${version.versionInfo?.info} - ${new Date(version.createdAt).toLocaleDateString()}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {selectedVersion?.content?.content?.map((question, index) => (
            <QuestionCard
                key={`${selectedVersion.id}-${index}`}
                baseQuestion={question}
                quizId={quizId}
                onNewVersion={handleNewVersion}
            />
        ))}
        </div>

    </div>
  );
}
