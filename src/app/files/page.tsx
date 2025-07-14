import FilesDashboardClient from '@/components/FilesDashboardClient';
import { fetchFiles } from '@/lib/dataFetch/files';
import { fetchCourses } from '@/lib/dataFetch/courses';

export default async function FilesDashboard() {
  const files = await fetchFiles();
  const courses = await fetchCourses();

  return <FilesDashboardClient files={files} courses={courses} />;
}
