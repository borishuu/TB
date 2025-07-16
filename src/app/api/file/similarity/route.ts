import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const topics = form.getAll('topics') as string[];

    try {
        if (!topics || topics.length === 0) {
            return NextResponse.json({ error: "Aucun sujet fourni" }, { status: 400 });
        }
                
        const searchString = topics.join(" | "); // PostgreSQL OR operator

        const files = await prisma.file.findMany({
            where: {
                OR: [
                    {
                      textContent: {
                        search: searchString,
                      },
                    },
                    {
                      fileName: {
                        search: searchString,
                      },
                    },
                ],
            },
            orderBy: {
                _relevance: {
                    fields: ['textContent'],
                    search: searchString,
                    sort: 'desc',
                },
            },
            take: 5,
        });    

        return NextResponse.json({ files });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}