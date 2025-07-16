import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGenerationHandler } from '@/lib/llm/LLMHandlerFactory';
import { FileWithContext } from '@/types';

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const title = form.get('title') as string;
    const contentFiles = form.getAll("contentFiles") as File[];
    const contentFilesMeta = form.get("contentFilesMeta") as string;
    const poolFilesMeta = form.get("poolFilesMeta") as string; 
    const globalDifficulty = form.get("difficulty") as string;
    const questionTypes = form.getAll("questionTypes") as string[];
    const suggestedFileIds = form.getAll("suggestedFileIds").map(id => Number(id));
    const model = form.get("model") as string;
    const prompts = form.get("prompts") as string;
    const courseIdStr = form.get("courseId") as string;

    try {
        if (!title) {
            return NextResponse.json({ error: "Evaluation doit avoir un titre" }, { status: 400 });
        }

        if ((!contentFiles || contentFiles.length === 0) && suggestedFileIds.length === 0) {
            return NextResponse.json({ error: "Au moins un fichier doit être fourni" }, { status: 400 });
        }

        if (!globalDifficulty) {
            return NextResponse.json({ error: "La difficulté doit être fournie" }, { status: 400 });
        }

        if (questionTypes.length === 0) {
            return NextResponse.json({ error: "Au moins un type de question doit être fourni" }, { status: 400 });
        }

        if (!model) {
            console.log("Model not provided, using default");
            return NextResponse.json({ error: "Modèle LLM doit être fourni" }, { status: 400 });
        }

        if (!prompts) {
            console.log("Prompts not provided");
            return NextResponse.json({ error: "Version des prompts doit être fourni" }, { status: 400 });
        }

        const courseId = Number(courseIdStr);

        if (!courseId || isNaN(courseId)) {
            return NextResponse.json({ error: "Course ID invalide" }, { status: 400 });
        }

        // Parse local file metadata
        let parsedMeta: { name: string; contextType: 'course' | 'evalInspiration' }[] = [];
        try {
            parsedMeta = JSON.parse(contentFilesMeta);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid contentFilesMeta JSON' }, { status: 400 });
        }

        // Parse pool file metadata
        let parsedPoolMeta: { name: string; contextType: 'course' | 'evalInspiration' }[] = [];
        try {
            parsedPoolMeta = JSON.parse(poolFilesMeta);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid poolFilesMeta JSON' }, { status: 400 });
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
                contextType: parsedPoolMeta.find(m => m.name === f.fileName)?.contextType || 'course' 
            } as FileWithContext))
        ];

        const generationResult = await generationHandler.generateEvaluation({ files: allFiles, questionTypes, globalDifficulty, genModel: model });
     

        // Ensure quizText is valid JSON before saving
        let quizJSON;
        try {
            quizJSON = JSON.parse(generationResult.evaluation);
        } catch (error) {            
            return NextResponse.json({ error: "L'évaluation généré n'est pas du JSON valide" }, { status: 500 });
        }

        // Create the evaluation without a current version
        const evaluation = await prisma.evaluation.create({
            data: {
                title,
                genModel: model,
                metadata: generationResult.metadata,
                course: { connect: { id: courseId as number } },
            },
        });
        
        // Create the version and connect it to the evaluation
        const version = await prisma.evaluationVersion.create({
            data: {
                content: quizJSON,
                versionInfo: { versionNumber: 1, info: "Version initiale" },
                evaluation: { connect: { id: evaluation.id } },
            },
        });
        
        // Update the evaluation to set the currentVersion
        await prisma.evaluation.update({
            where: { id: evaluation.id },
            data: {
                currentVersion: { connect: { id: version.id } }
            },
        });

        return NextResponse.json(evaluation.id);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Erreur dans la génération de l'évaluation" }, { status: 500 });
    }
}