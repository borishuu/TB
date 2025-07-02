import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { GeminiHandler } from '@/lib/llm/GeminiHandler';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    try {
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }
        const { id } = await context.params;
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

        // Fetch the existing quiz
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
        });

        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        const quizContentObject = quiz.content as Prisma.JsonObject;
        const currentContent = quizContentObject['content'] as Prisma.JsonArray;

        // Find the question to regenerate
        const questionIndex = currentContent.findIndex((q: any) => q.number === questionNumber);

        if (questionIndex === -1) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const llmHandler = GeminiHandler.getInstance(process.env.GEMINI_API_KEY as string);

        const newQuestion = await llmHandler.regenerateQuestion({ prompt, question: currentContent[questionIndex] });

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

        console.log(currentContent);

        // Update the quiz in the database
        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: {
                content: { content: currentContent }
            }
        });

        return NextResponse.json(questionJSON, { status: 200 });
    } catch (error) {
        console.error("Error updating quiz:", error);
        return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
    }
}