import { fetchEval } from '@/lib/dataFetch/evals';
import EvaluationViewer from '@/components/EvaluationViewer';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evaluation = await fetchEval(id);

  return <EvaluationViewer evaluation={evaluation} quizId={id} />;
}
