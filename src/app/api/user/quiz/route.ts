import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {

        const { userId, error } = await verifyAuth(request);
        
        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const userQuizzes = await prisma.quiz.findMany({
            where: { authorId: userId as number },
            select: {
                id: true,
                title: true,
                content: true
            }
        });

        return NextResponse.json(userQuizzes, { status: 200 });
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch user quizzes" }, { status: 500 });
    } finally {
    }
}