'use client';

import { Eval, Course } from '@/types';
import { useState } from 'react';
import EvalCard from '@/components/EvalCard';
import EditEvalForm from '@/components/forms/EditEvalForm';

interface EvalGridProps {
  evaluations: Eval[];
  courses: Course[];
}

export default function EvalsGrid({ evaluations, courses }: EvalGridProps) {
    const [editingEval, setEditingEval] = useState<Eval | null>(null);
    const [search, setSearch] = useState('');
    const [evalList, setEvalList] = useState(evaluations);
  
    const filtered = evalList.filter((ev) =>
        ev.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleEditStart = (evalToEdit: Eval) => {
      console.log("evalsgrid");
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
        <div className="flex justify-between mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
  
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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