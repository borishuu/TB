import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';  

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const evalId = parseInt(id, 10);

        if (isNaN(evalId)) {
            return NextResponse.json({ error: "ID d'évaluation invalide" }, { status: 400 });
        }

        const body = await request.json();
        const { editQuestion } = body;

        if (!editQuestion || !editQuestion.number) {
            return NextResponse.json({ error: "La question ne possède pas de numéro valide'" }, { status: 400 });
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
        await prisma.evaluation.update({
            where: { id: evalId },
            data: {
                currentVersionId: newVersion.id,
            }
        });

        return NextResponse.json({ newVersion }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}