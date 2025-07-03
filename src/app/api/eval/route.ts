import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import { GeminiHandler } from '@/lib/llm/gemini/GeminiHandler';
import { LLMHandler, FileWithContext } from '@/types';

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const title = form.get('title') as string;
    const contentFiles = form.getAll("contentFiles") as File[];
    const contentFilesMeta = form.get("contentFilesMeta") as string;
    const globalDifficulty = form.get("difficulty") as string;
    const questionTypes = form.getAll("questionTypes") as string[];
    const suggestedFileIds = form.getAll("suggestedFileIds").map(id => Number(id));

    const llmHandler: LLMHandler = GeminiHandler.getInstance(process.env.GEMINI_API_KEY as string);

    try {

        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        if (!title) {
            return NextResponse.json({ error: "Quiz must have a title" }, { status: 400 });
        }

        if ((!contentFiles || contentFiles.length === 0) && suggestedFileIds.length === 0) {
            return NextResponse.json({ error: "At least one file must be provided" }, { status: 400 });
        }

        if (!globalDifficulty) {
            return NextResponse.json({ error: "Global difficulty must be provided" }, { status: 400 });
        }

        if (questionTypes.length === 0) {
            return NextResponse.json({ error: "At least one question type must be provided" }, { status: 400 });
        }

        // Parse local file metadata
        let parsedMeta: { name: string; contextType: 'course' | 'evalInspiration' }[] = [];
        try {
            parsedMeta = JSON.parse(contentFilesMeta);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid contentFilesMeta JSON' }, { status: 400 });
        }

        // TODO: Handle pool files context types
        let poolFiles: { fileName: string, filePath: string, mimeType: string }[] = [];

        if (suggestedFileIds.length > 0) {
          const results = await prisma.file.findMany({
            where: { id: { in: suggestedFileIds } },
            select: {
              fileName: true,
              filePath: true,
              mimeType: true,
            },
          });

          poolFiles = results;
        }

        //const allFiles: (LocalFile | { fileName: string, filePath: string, mimeType: string })[] = [...contentFiles, ...poolFiles];
        const allFiles: FileWithContext[] = [
            ...contentFiles.map(f => ({ 
                file: f, 
                contextType: parsedMeta.find(m => m.name === f.name)?.contextType || 'course' 
            } as FileWithContext)), 
            ...poolFiles.map(f => ({ 
                file: { fileName: f.fileName, filePath: f.filePath, mimeType: f.mimeType }, 
                contextType: 'course' 
            } as FileWithContext))
        ];

        const generationResult = await llmHandler.generateEvaluation({ files: allFiles, questionTypes, globalDifficulty });
     

        // Ensure quizText is valid JSON before saving
        let quizJSON;
        try {
            quizJSON = JSON.parse(generationResult.evaluation);
        } catch (error) {
            console.error("Invalid JSON format:", error);
            return NextResponse.json({ error: "Generated quiz is not valid JSON" }, { status: 500 });
        }

        const createdEval = await prisma.quiz.create({
            data: {
                title: title,
                content: quizJSON,
                prompts: JSON.parse(JSON.stringify({
                    contextPrompt: "",
                    quizPrompt: ""
                })),
                genModel: llmHandler.genModel,
                author: {connect: {id: userId as number}},
            },
        });

        return NextResponse.json(createdEval.id);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}