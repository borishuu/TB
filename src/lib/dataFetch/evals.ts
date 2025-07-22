import { Eval } from '@/types';
import { cookies } from 'next/headers';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function fetchEvals(): Promise<Eval[]> {
    const cookieStore = await cookies();

    const response = await fetch(`${baseUrl}/api/eval`, {
        headers: {
            Cookie: cookieStore.toString(),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to fetch evaluations');
    }

    return response.json();
}

export async function fetchEval(id: string): Promise<Eval> {
    const cookieStore = await cookies();

    const response = await fetch(`${baseUrl}/api/eval/${id}`, {
        headers: {
            Cookie: cookieStore.toString(),
        },
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to fetch evaluation');
    }

    return response.json();
}
