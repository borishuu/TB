import {NextRequest, NextResponse} from 'next/server';
import { GoogleGenerativeAI, ObjectSchema, Schema, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY as string);

// TODO: dynamically adapt schema based on user input, ajouter descriptions sur fichiers, edit question, stocker prompt avec quiz pour avoir un suivi, creation date, gemni model, etc... penser cdc
const quizSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        content: {
            type: SchemaType.ARRAY,
            minItems: 10,
            description: "Array of questions for the quiz.",
            items: {
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
                required: ["number", "questionText", "questionType", "correctAnswer"],
            }
        }
    },
    required: ["content"],
};

const genModel = 'models/gemini-2.0-flash'

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

        // Upload all files with Gemini API after writing them to a temporary location
        const fileUploadResults = await Promise.all(
            contentFiles.map(async (file) => {
                // Convert the File to a Buffer
                const fileBuffer = await file.arrayBuffer();

                // Define a temporary directory and ensure it exists
                const tmpDir = path.join(process.cwd(), 'tmp');
                await fs.promises.mkdir(tmpDir, { recursive: true });

                // Create a temporary file path
                const tmpFilePath = path.join(tmpDir, file.name);

                // Write the file buffer to disk
                await fs.promises.writeFile(tmpFilePath, Buffer.from(fileBuffer));

                // Upload the file using the temporary file path
                const uploadResult = await fileManager.uploadFile(
                    tmpFilePath, 
                    {
                        mimeType: file.type,
                        displayName: file.name,
                    }
                );

                // Rremove the temporary file after upload
                await fs.promises.unlink(tmpFilePath);

                return uploadResult;
            })
        );

        console.log("Starting Phase 1: Generating context...");
        const contextPrompt = `
Analysez le contenu des fichiers fournis et générez un résumé structuré des concepts clés abordés.
- Mélangez les thèmes des différents fichiers de manière cohérente.
- Identifiez les notions principales et expliquez-les clairement.
- Mettez en avant les points importants qui peuvent être utilisés pour créer un quiz.
- Ne copiez pas directement le contenu des fichiers, mais reformulez et synthétisez.
- Présentez le résumé sous une forme organisée et lisible.
        `;

        const contextModel = genAI.getGenerativeModel({ model: genModel });

        // Generate context with uploaded files

        const contextResult = await contextModel.generateContent([
            contextPrompt,
            ...fileUploadResults.map(uploadResult => ({ fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType,
            } }))
        ]);
        
        const contextText = contextResult.response.text();
        console.log("Phase 1 Completed: Context generated.");

        console.log("Starting Phase 2: Generating quiz...");
        const quizPrompt = `
Générez un quiz basé sur le résumé suivant, et en vous inspirant des séries d'exercices fournis (sans les recopier) :

${contextText}

- Incluez au moins 10 questions.
- L'ordre des questions doit être indépendant de l'ordre des chapitres fournis.
- Assurez-vous que les questions couvrent les concepts du résumé.
- Variez le type de questions : QCM, questions ouvertes, compréhension de code, écriture de code.
- La quantité des différents types de questions doit être équilibrée.
- Les exercices doivent être difficiles est doivent nécessiter beaucoup de reflexion.`;

        /*const quizResult = await model.generateContent([
            quizPrompt,
            ...exercices.map(exercice => ({ fileData: exercice }))
        ]);*/
        const quizModel = genAI.getGenerativeModel({
            model: genModel,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: quizSchema
            }
        });

        const quizResult = await quizModel.generateContent([
            quizPrompt
        ]);
        
        const quizText = quizResult.response.text();
        console.log("Phase 2 Completed: Quiz generated.");

        // Ensure quizText is valid JSON before saving
        let quizJSON;
        try {
            quizJSON = JSON.parse(quizText);
        } catch (error) {
            console.error("Invalid JSON format:", error);
            return NextResponse.json({ error: "Generated quiz is not valid JSON" }, { status: 500 });
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