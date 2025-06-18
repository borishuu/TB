import {NextRequest, NextResponse} from 'next/server';
import { GoogleGenerativeAI, ObjectSchema, Schema, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: NextRequest) {
    const form = await request.formData();

    const title = form.get('title') as string;
    const contentFiles = form.getAll("contentFiles") as File[];

    try {

        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        if (!title) {
            return NextResponse.json({ error: "Quiz must have a title" }, { status: 400 });
        }

        if (!contentFiles || contentFiles.length === 0) {
            return NextResponse.json({ error: "At least one file must be provided" }, { status: 400 });
        }
  

        await prisma.quiz.create({
            data: {
                title: title,
                content: quizJSON,
                prompts: JSON.parse(JSON.stringify({
                    contextPrompt: contextPrompt,
                    quizPrompt: quizPrompt
                })),
                genModel: genModel,
                author: {connect: {id: userId as number}},
            },
        });

        return NextResponse.json({ context: contextText, quiz: quizText });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}