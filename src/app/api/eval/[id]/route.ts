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

        const evaluation = await prisma.evaluation.findUnique({
            where: { id: quizId},
            include: {
                currentVersion: true,
                versions: {
                  orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!evaluation) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });

        return NextResponse.json(evaluation, { status: 200 });
    } catch (error) {
        console.error("Error fetching evaluation:", error);
        return NextResponse.json({ error: "Failed to fetch evaluation" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const { id } = await params;
        const evalId = parseInt(id, 10);

        if (isNaN(evalId)) {
            return NextResponse.json({ error: "Invalid evaluation ID" }, { status: 400 });
        }

        const body = await request.json();
        const { editQuestion } = body;

        if (!editQuestion || !editQuestion.number) {
            return NextResponse.json({ error: "Updated question must include a valid 'number'" }, { status: 400 });
        }

        // Get current version content
        const evaluation = await prisma.evaluation.findUnique({
            where: { id: evalId },
            include: {
                currentVersion: true,
            }
        });

        if (!evaluation || !evaluation.currentVersion) {
            return NextResponse.json({ error: "Evaluation ou version actuelle pas toruvée" }, { status: 404 });
        }

        const quizContent = evaluation.currentVersion.content as Prisma.JsonObject;
        const questions = (quizContent['content'] as Prisma.JsonArray) || [];

        const updatedQuestions = questions.map((q: any) =>
            q.number === editQuestion.number ? editQuestion : q
        );

        const updatedContent = {
            ...quizContent,
            content: updatedQuestions
        };

        const previousVersionInfo = evaluation.currentVersion.versionInfo as Prisma.JsonObject | null;
        const previousNumber = previousVersionInfo?.versionNumber as number | undefined;
        const nextVersionNumber = (previousNumber ?? 0) + 1;

        // Create new version
        const newVersion = await prisma.evaluationVersion.create({
            data: {
                content: updatedContent,
                evaluation: { connect: { id: evalId } },
                versionInfo: { versionNumber: nextVersionNumber, info: `Modification de la question ${editQuestion.number}` },
            }
        });

        // Update evaluation to point to new current version
        const updatedQuiz = await prisma.evaluation.update({
            where: { id: evalId },
            data: {
                currentVersionId: newVersion.id,
            }
        });

        return NextResponse.json({ newVersion }, { status: 200 });
    } catch (error) {
        console.error("Error updating evaluation version:", error);
        return NextResponse.json({ error: "Failed to update evaluation version" }, { status: 500 });
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
        const quiz = await prisma.evaluation.findUnique({
            where: { id: quizId },
        });

        if (!quiz) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        if (quiz.authorId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.evaluation.delete({
            where: { id: quizId },
        });

        return NextResponse.json({ message: "Evaluation deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting evaluation:", error);
        return NextResponse.json({ error: "Failed to delete evaluation" }, { status: 500 });
    }
}
