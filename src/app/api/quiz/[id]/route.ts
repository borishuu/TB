import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    try {
        
        const { id } = await context.params;
        const quizId = parseInt(id, 10);

        if (isNaN(quizId)) {
            return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId},
        });

        if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

        return NextResponse.json(quiz, { status: 200 });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    }
}
