import {NextRequest, NextResponse} from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const form = await request.formData();
    const title = form.get('title') as string;
    const contentStr = form.get("content") as string;
    const courseIdStr = form.get("courseId") as string;

    try {
        if (!title) {
            return NextResponse.json({ error: "Evaluation doit avoir un titre" }, { status: 400 });
        }

        if (!contentStr) {
            return NextResponse.json({ error: "Le fichier doit contenir le contenu de l'évaluation" }, { status: 400 });
        }

        let quizJSON;
        try {
          quizJSON = JSON.parse(contentStr);
        } catch (e) {
          return NextResponse.json({ error: "Le contenu JSON est invalide" }, { status: 400 });
        }


        const courseId = Number(courseIdStr);
        if (!courseId || isNaN(courseId)) {
            return NextResponse.json({ error: "Cours ID invalide" }, { status: 400 });
        }

        // Create the evaluation without a current version
        const evaluation = await prisma.evaluation.create({
            data: {
                title,
                course: { connect: { id: courseId as number } },
            },
        });
        
        // Create the version and connect it to the evaluation
        const version = await prisma.evaluationVersion.create({
            data: {
                content: quizJSON,
                versionInfo: { versionNumber: 1, info: "Evaluation importée" },
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
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}