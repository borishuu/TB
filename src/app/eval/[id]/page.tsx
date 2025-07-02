import { fetchEval } from '@/lib/data/evals';
import QuestionCard from '@/components/QuestionCard';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const evaluation = await fetchEval(id);

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold text-center mb-4">{evaluation.title}</h1>
            <div className="space-y-6">
                {evaluation.content.content.map((question, index) => (
                    <QuestionCard key={index} baseQuestion={question} quizId={id} />
                ))}
            </div>
        </div>
    );
}
