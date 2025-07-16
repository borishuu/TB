import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {
        const userQuizzes = await prisma.evaluation.findMany({
            include: {
                currentVersion: true,
                course: {
                    select: {
                        courseName: true
                    }
                },
            }
            
        });

        return NextResponse.json(userQuizzes, { status: 200 });
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch user quizzes" }, { status: 500 });
    } finally {
    }
}