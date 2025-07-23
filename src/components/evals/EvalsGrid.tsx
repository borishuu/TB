'use client';

import { Eval, Course } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EvalCard from '@/components/evals/EvalCard';
import CreateEvalForm from '@/components/evals/CreateEvalForm';
import ImportEvalForm from '@/components/evals/ImportEvalForm';
import EditEvalForm from '@/components/evals/EditEvalForm';

interface EvalGridProps {
  evaluations: Eval[];
  courses: Course[];
}

export default function EvalsGrid({ evaluations, courses }: EvalGridProps) {
    const [editingEval, setEditingEval] = useState<Eval | null>(null);
    const [showImportForm, setShowImportForm] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [search, setSearch] = useState('');
    const [evalList, setEvalList] = useState(evaluations);
    const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | ''>('');
  
    const router = useRouter();

    const filtered = evalList.filter((ev) => {
      const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase ());
      const matchesCourse = selectedCourseFilter === '' || (ev.course as any).id === selectedCourseFilter;
      return matchesSearch && matchesCourse;
    });

    const handleNewStart = () => setShowNewForm(true);    
    const handleNewEnd = () => setShowNewForm(false);
    const handleNewSuccess = (id: number) => {
      //setShowNewForm(false)
      router.push(`/eval/${id}`);
    }

    const handleImportStart = () => setShowImportForm(true);
    const handleImportEnd = () => setShowImportForm(false);
    const handleImportSuccess = (id: number) => {
      setShowNewForm(false)
      router.push(`/eval/${id}`);
    }

    const handleEditStart = (evalToEdit: Eval) => {      
      setEditingEval(evalToEdit);
    };
  
    const handleEditSuccess = (updatedEval: Eval) => {
      setEvalList(prev =>
        prev.map(e => (e.id === updatedEval.id ? updatedEval : e))
      );
      setEditingEval(null);
    };

    const handleDelete = (id: number) => {
      setEvalList((prev) => prev.filter((ev) => ev.id !== id));
    };
  
    const handleDuplicate = (newEval: Eval) => {
      setEvalList((prev) => [newEval, ...prev]);
    };
  
    return (
      <>
        <div className="flex mb-4">
            <button onClick={handleNewStart} className="button mr-4">
                + Nouveau
            </button>
            <button onClick={handleImportStart} className="button">
                + Importer
            </button>
        </div>
        <div className="flex justify-between mb-4 gap-4 flex-wrap md:flex-nowrap">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={selectedCourseFilter}
            onChange={(e) =>
              setSelectedCourseFilter(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Tous les cours</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseName}
              </option>
            ))}
          </select>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map((ev) => (
              <EvalCard
              key={ev.id}
              evaluation={ev}
              onEdit={() => handleEditStart(ev)}
              onDelete={() => handleDelete(ev.id)}
              onDuplicate={handleDuplicate}
            />
            ))}
          </div>
        ) : (
          <p className="text-center">Aucune évaluation trouvée.</p>
        )}
        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <CreateEvalForm
              onClose={handleNewEnd}
              onSuccess={handleNewSuccess}
              courses={courses}
            />
          </div>
        )}

        {showImportForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <ImportEvalForm
              onClose={handleImportEnd}
              onSuccess={handleImportSuccess}
              courses={courses}
            />
          </div>
        )}
        {editingEval && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <EditEvalForm
              evaluation={editingEval}
              onClose={() => setEditingEval(null)}
              onSuccess={(updated) => handleEditSuccess(updated)}
              courses={courses}
            />
          </div>
        )}
      </>
    );
  }