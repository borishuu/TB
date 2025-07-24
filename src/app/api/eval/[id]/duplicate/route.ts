import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const evalId = parseInt(id, 10);
        if (isNaN(evalId)) {
            return NextResponse.json({ error: "ID d'évaluation invalide" }, { status: 400 });
        }

        // Fetch the original evaluation with its current version
        const originalEval = await prisma.evaluation.findUnique({
            where: { id: evalId },
            include: { currentVersion: true },
        });

        if (!originalEval || !originalEval.currentVersion) {
            return NextResponse.json({ error: "Evaluation pas toruvée" }, { status: 404 });
        }

        // Create duplicated evaluation
        const duplicatedEval = await prisma.evaluation.create({
            data: {
                title: originalEval.title + ' (copie)',
                metadata: originalEval.metadata ?? Prisma.JsonNull,
                genModel: originalEval.genModel,
                courseId: originalEval.courseId,
            },
        });

        // Create a new initial version
        const newVersion = await prisma.evaluationVersion.create({
            data: {
                evaluationId: duplicatedEval.id,
                content: originalEval.currentVersion.content ?? Prisma.JsonNull,
                versionInfo: {
                    versionNumber: 1, 
                    info: `Duplication de l'évaluation ${originalEval.title}`,
                },
            }
        });

        // Set this version as the currentVersion of the duplicated evaluation
        await prisma.evaluation.update({
            where: { id: duplicatedEval.id },
            data: {
                currentVersionId: newVersion.id
            }
        });

        return NextResponse.json(duplicatedEval.id, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
