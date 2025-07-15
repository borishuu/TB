import CreateEvalForm from '@/components/CreateEvalForm';
import { fetchCourses } from '@/lib/dataFetch/courses';

export default async function CreateEval() {
    const courses = await fetchCourses();
  
    return <CreateEvalForm courses={courses} />;
}
