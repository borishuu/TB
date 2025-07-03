import FilesDashboardClient from '@/components/FilesDashboardClient';
import { fetchFiles } from '@/lib/data/files';
import { PoolFile } from '@/types';

export default async function FilesDashboard() {
  const files = await fetchFiles();

  return <FilesDashboardClient files={files} />;
}
