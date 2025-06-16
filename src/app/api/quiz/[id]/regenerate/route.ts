import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, ObjectSchema, Schema, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

// TODO centralize all AI requests in a lib file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const questionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        number: {
            type: SchemaType.STRING,
            description: "The question number.",
            nullable: false
        },
        questionText: {
            type: SchemaType.STRING,
            description: "The text of the question.",
            nullable: false
        },
        questionType: {
            type: SchemaType.STRING,
            format: "enum",
            description: "The type of the question.",
            enum: ["mcq", "open", "codeComprehension", "codeWriting"],
            nullable: false
        },
        options: {
            type: SchemaType.ARRAY,
            description: "Array of answer options for multiple choice questions.",
            items: {
                type: SchemaType.STRING
            },
            minItems: 0
        },
        correctAnswer: {
            type: SchemaType.STRING,
            description: "The correct answer for the question.",
            nullable: false
        },
        explanation: {
            type: SchemaType.STRING,
            description: "An explanation for the correct answer."
        }
    },
    required: ["number", "questionText", "questionType", "correctAnswer"]
};


async function generateNewQuestion(prompt: string, question: any) {
    const questionRegenPrompt = `
Tu es un générateur de quiz intelligent. Ta tâche est d'améliorer la question fournie en suivant précisément ces consignes : 

- Respecte le format : Garde le même type de question (${question.questionType}).
- Améliore la clarté et la pertinence : Reformule si nécessaire pour plus de précision et d'intelligibilité.
- Respecte les contraintes utilisateur : Applique ces modifications demandées : "${prompt}".

Question originale à améliorer :  
${JSON.stringify(question)}
`;

    const regenModel = genAI.getGenerativeModel({
        model: 'models/gemini-2.0-flash',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: questionSchema
        }
    });

    const result = await regenModel.generateContent([
        questionRegenPrompt
    ]);

    return result.response.text();
}


export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    try {
        // Ensure only a logged in user can call this route
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
            return NextResponse.json({ error: "Both 'questionNumber' and 'prompt' are required" }, { status: 400 });
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

        // Generate a new question using AI
        const newQuestion = await generateNewQuestion(prompt, currentContent[questionIndex]);

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