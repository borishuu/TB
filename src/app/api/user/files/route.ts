import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {
        const files = await prisma.file.findMany({
            select: {
                id: true,
                fileName: true,
                course: {
                    select: {
                        courseName: true
                    }
                },
                createdAt: true
            },
        })

        return NextResponse.json(files, { status: 200 })
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch user quizzes" }, { status: 500 });
    } finally {
    }
}