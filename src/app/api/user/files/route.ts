import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {

        const { userId, error } = await verifyAuth(request);
        
        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        return NextResponse.json([
            {id: 1, fileName: "fichier1.pdf", course: "PAS", createdAt: "2023-10-01"},
            {id: 2, fileName: "fichier2.pdf", course: "PAS", createdAt: "2023-10-01"},
            {id: 3, fileName: "fichier3.pdf", course: "HPC", createdAt: "2023-10-01"},
            {id: 4, fileName: "fichier4.pdf", course: "VTK", createdAt: "2023-10-01"},
            {id: 5, fileName: "fichier5.pdf", course: "VTK", createdAt: "2023-10-01"},
            {id: 6, fileName: "fichier6.pdf", course: "MVP", createdAt: "2023-10-01"},
        ], { status: 200 });

        /*const userQuizzes = await prisma.quiz.findMany({
            where: { authorId: userId as number },
            select: {
                id: true,
                title: true,
                content: true
            }
        });

        return NextResponse.json(userQuizzes, { status: 200 });*/
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch user quizzes" }, { status: 500 });
    } finally {
    }
}