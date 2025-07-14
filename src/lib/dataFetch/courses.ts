import { Course } from '@/types';
import { cookies } from 'next/headers';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function fetchCourses(): Promise<Course[]> {
    const cookieStore = await cookies();

    const response = await fetch(`${baseUrl}/api/course`, {
        headers: {
            Cookie: cookieStore.toString(),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to fetch courses');
    }

    return response.json();
}