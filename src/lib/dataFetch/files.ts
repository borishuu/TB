import { PoolFile } from '@/types';
import { cookies } from 'next/headers';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function fetchFiles(): Promise<PoolFile[]> {
    const cookieStore = await cookies();

    const response = await fetch(`${baseUrl}/api/file`, {
        headers: {
            Cookie: cookieStore.toString(),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to fetch files');
    }

    return response.json();
}