import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getRegenerationHandler } from '@/lib/llm/LLMHandlerFactory';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const quizId = parseInt(id, 10);
        if (isNaN(quizId)) {
            return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
        }

        // Expecting the question number and a prompt for regeneration
        const body = await request.json();
        const { questionNumber, prompt } = body;

        if (!questionNumber || !prompt) {
            return NextResponse.json({ error: "Both questionNumber and prompt are required" }, { status: 400 });
        }

        // Fetch the existing evaluation
        const evaluation = await prisma.evaluation.findUnique({
            where: { id: quizId },
            include: {
                currentVersion: true,
            }
        });

        if (!evaluation || !evaluation.currentVersion) {
            return NextResponse.json({ error: "Evaluation ou version actuelle pas toruvée" }, { status: 404 });
        }

        const quizContentObject = evaluation.currentVersion.content as Prisma.JsonObject;
        const currentContent = quizContentObject['content'] as Prisma.JsonArray;

        // Find the question to regenerate
        const questionIndex = currentContent.findIndex((q: any) => q.number === questionNumber);

        if (questionIndex === -1) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const llmHandler = await getRegenerationHandler('models/gemini-2.5-flash', 'v1');

        const newQuestion = await llmHandler.regenerateQuestion({ genModel: 'models/gemini-2.5-flash', prompt, question: currentContent[questionIndex] });

        if (!newQuestion) {
            return NextResponse.json({ error: "Failed to generate new question" }, { status: 500 });
        }

        let questionJSON;
        try {
            questionJSON = JSON.parse(newQuestion);
        } catch (error) {
            console.error("Invalid JSON format:", error);
            return NextResponse.json({ error: "Generated quiz is not valid JSON" }, { status: 500 });
        }

        // Replace the old question with the regenerated one
        currentContent[questionIndex] = questionJSON;

        const previousVersionInfo = evaluation.currentVersion.versionInfo as Prisma.JsonObject | null;
        const previousNumber = previousVersionInfo?.versionNumber as number | undefined;
        const nextVersionNumber = (previousNumber ?? 0) + 1;

        // Create new evaluation version
        const newVersion = await prisma.evaluationVersion.create({
            data: {
                content: {
                    content: currentContent
                },
                evaluation: {
                    connect: { id: quizId }
                },
                versionInfo: { versionNumber: nextVersionNumber, info: `Régénération de la question ${questionNumber}`}
            }
        });

        // Update evaluation to point to new version
        await prisma.evaluation.update({
            where: { id: quizId },
            data: {
                currentVersion: {
                    connect: { id: newVersion.id }
                }
            }
        });

        return NextResponse.json({ newVersion }, { status: 200 });
    } catch (error) {
        console.error("Error updating quiz:", error);
        return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
    }
}