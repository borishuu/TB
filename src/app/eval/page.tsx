import { fetchEvals } from '@/lib/dataFetch/evals';
import Link from 'next/link';
import EvalsGrid from '@/components/EvalsGrid';

export default async function EvaluationsDashboard() {
    const evaluations = await fetchEvals();

    return (
        <div className="max-w-full mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Mes évaluations</h1>

            <div className="flex justify-end mb-4">
            <Link href="/eval/create" className="button">
                + Nouveau
            </Link>
            </div>

            <EvalsGrid evaluations={evaluations} />
        </div>
    );
}
