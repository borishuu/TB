import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
//import { GeminiHandler } from '@/lib/llm/gemini/GeminiHandler';
//import { MistralHandler } from '@/lib/llm/mistral/MistralHandler';
import { getGenerationHandler } from '@/lib/llm/LLMHandlerFactory';
import { FileWithContext } from '@/types';

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const title = form.get('title') as string;
    const contentFiles = form.getAll("contentFiles") as File[];
    const contentFilesMeta = form.get("contentFilesMeta") as string; 
    const globalDifficulty = form.get("difficulty") as string;
    const questionTypes = form.getAll("questionTypes") as string[];
    const suggestedFileIds = form.getAll("suggestedFileIds").map(id => Number(id));
    const model = form.get("model") as string;
    const prompts = form.get("prompts") as string;

    //const llmHandler: LLMHandler = GeminiHandler.getInstance(process.env.GEMINI_API_KEY as string);
    //const llmHandler: LLMHandler = MistralHandler.getInstance(process.env.MISTRAL_API_KEY as string);

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

        if (!model) {
            console.log("Model not provided, using default");
            return NextResponse.json({ error: "Model must be provided" }, { status: 400 });
        }

        if (!prompts) {
            console.log("Prompts not provided");
            return NextResponse.json({ error: "Prompts must be provided" }, { status: 400 });
        }

        // Parse local file metadata
        let parsedMeta: { name: string; contextType: 'course' | 'evalInspiration' }[] = [];
        try {
            parsedMeta = JSON.parse(contentFilesMeta);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid contentFilesMeta JSON' }, { status: 400 });
        }

        const generationHandler = await getGenerationHandler(model, prompts);

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

        const generationResult = await generationHandler.generateEvaluation({ files: allFiles, questionTypes, globalDifficulty, genModel: model });
     

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
                metadata: generationResult.metadata,
                genModel: model,
                author: {connect: {id: userId as number}},
            },
        });

        return NextResponse.json(createdEval.id);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}