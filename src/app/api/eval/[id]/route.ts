import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }
        
        const { id } = await params;
        const quizId = parseInt(id, 10);

        if (isNaN(quizId)) {
            return NextResponse.json({ error: "Invalid evaluation ID" }, { status: 400 });
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId},
        });

        if (!quiz) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });

        return NextResponse.json(quiz, { status: 200 });
    } catch (error) {
        console.error("Error fetching evaluation:", error);
        return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const { id } = await params;
        const quizId = parseInt(id, 10);
        if (isNaN(quizId)) {
            return NextResponse.json({ error: "Invalid evaluation ID" }, { status: 400 });
        }

        // Expecting the updated question in the request body
        const body = await request.json();
        const { editQuestion } = body;

        if (!editQuestion || !editQuestion.number) {
            return NextResponse.json({ error: "Updated question must include a valid 'number'" }, { status: 400 });
        }

        // Fetch the existing quiz
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
        });

        if (!quiz) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        const quizContentObject = quiz.content as Prisma.JsonObject

        // Get the current questions array, defaulting to an empty array if not present.
        const currentContent = quizContentObject['content'] as Prisma.JsonArray;

        // Update only the question that matches the updated question's number.
        const updatedQuestions = currentContent.map((q: any) => {
            if (q.number === editQuestion.number) {
                return editQuestion;
            }
            return q;
        });

        // Update the quiz with the new questions array.
        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                content: { content: updatedQuestions }
            }
        });

        return NextResponse.json(updatedQuiz, { status: 200 });
    } catch (error) {
        console.error("Error updating evaluation:", error);
        return NextResponse.json({ error: "Failed to update evaluation" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const { id } = await params;
        const quizId = parseInt(id, 10);

        if (isNaN(quizId)) {
            return NextResponse.json({ error: "Invalid evaluation ID" }, { status: 400 });
        }

        // Ensure the eval belongs to the authenticated user
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
        });

        if (!quiz) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        if (quiz.authorId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.quiz.delete({
            where: { id: quizId },
        });

        return NextResponse.json({ message: "Evaluation deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting evaluation:", error);
        return NextResponse.json({ error: "Failed to delete evaluation" }, { status: 500 });
    }
}
