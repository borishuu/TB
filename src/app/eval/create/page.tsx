import CreateEvalForm from '@/components/forms/CreateEvalForm';
import { fetchCourses } from '@/lib/dataFetch/courses';

export default async function CreateEval() {
    const courses = await fetchCourses();
  
    return <CreateEvalForm courses={courses} />;
}
