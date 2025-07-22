import { fetchEvals } from '@/lib/dataFetch/evals';
import { fetchCourses } from '@/lib/dataFetch/courses';
import Link from 'next/link';
import EvalsGrid from '@/components/EvalsGrid';

export default async function EvaluationsDashboard() {
    const evaluations = await fetchEvals();
    const courses = await fetchCourses();

    return (
        <div className="max-w-full mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Mes évaluations</h1>

            <div className="flex justify-end mb-4">
                <Link href="/eval/create" className="button mr-4">
                    + Nouveau
                </Link>
                <Link href="/eval/import" className="button">
                    + Importer
                </Link>
            </div>

            <EvalsGrid courses={courses} evaluations={evaluations} />
        </div>
    );
}
