'use client';

import { Eval } from '@/types';
import { useState } from 'react';
import EvalCard from '@/components/EvalCard';

export default function EvalsGrid({ evaluations }: { evaluations: Eval[] }) {
    const [search, setSearch] = useState('');
  
    const filtered = evaluations.filter((ev) =>
        ev.title.toLowerCase().includes(search.toLowerCase())
    );
  
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
              <EvalCard key={ev.id} evaluation={ev} />
            ))}
          </div>
        ) : (
          <p className="text-center">Aucune évaluation trouvée.</p>
        )}
      </>
    );
  }