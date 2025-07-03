import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyAuth } from '@/lib/verifyAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        // Fetch the original evaluation
        const originalEval = await prisma.quiz.findUnique({
            where: { id: evalId },
        });

        if (!originalEval) {
            return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }

        // Create a copy of the evaluation
        const duplicatedEval = await prisma.quiz.create({
            data: {
              title: originalEval.title + ' (copie)',
              content: originalEval.content === null ? Prisma.JsonNull : originalEval.content,
              prompts: originalEval.prompts === null ? Prisma.JsonNull : originalEval.prompts,
              genModel: originalEval.genModel,
              authorId: originalEval.authorId,
            },
          });

        return NextResponse.json(duplicatedEval, { status: 201 });
    } catch (error) {
        console.error("Error duplicating evaluation:", error);
        return NextResponse.json({ error: "Failed to duplicate evaluation" }, { status: 500 });
    }
}
