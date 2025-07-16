import ImportEvalForm from '@/components/ImportEvalForm';
import { fetchCourses } from '@/lib/dataFetch/courses';

export default async function ImportEval() {
    const courses = await fetchCourses();
  
    return <ImportEvalForm courses={courses} />;
}
