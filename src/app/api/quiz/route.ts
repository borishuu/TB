import {NextRequest, NextResponse} from 'next/server';
import { GoogleGenerativeAI, ObjectSchema, Schema, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';


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
    const suggestedFileIds = form.getAll("suggestedFileIds").map(id => Number(id));

    const modelTiming: any = {
        genModel,
        status: 'ok',
        contextTimeMs: null,
        quizTimeMs: null,
      };
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

        // Upload all files with Gemini API after writing them to a temporary location

        const fileUploadResults = await Promise.all(
          [...contentFiles, ...poolFiles].map(async (file) => {
            if (file instanceof File) {
              // Handle local uploaded files
              const fileBuffer = await file.arrayBuffer();
              const tmpDir = path.join(process.cwd(), 'tmp');
              await fs.promises.mkdir(tmpDir, { recursive: true });
              const tmpFilePath = path.join(tmpDir, file.name);
              await fs.promises.writeFile(tmpFilePath, Buffer.from(fileBuffer));
        
              const uploadResult = await fileManager.uploadFile(tmpFilePath, {
                mimeType: file.type,
                displayName: file.name,
              });
        
              await fs.promises.unlink(tmpFilePath);
              return uploadResult;
            } else {
              // Handle pool files (already stored on disk)
              const uploadResult = await fileManager.uploadFile(file.filePath, {
                mimeType: file.mimeType,
                displayName: file.fileName,
              });
              return uploadResult;
            }
          })
        );        

        console.log("Starting Phase 1: Generating context...");
        
        const contextModel = genAI.getGenerativeModel({ model: genModel });

        const contextPrompt = `
Vous êtes un assistant pédagogique expert. Votre objectif est d'analyser du contenu de cours brut pour en extraire un contexte claire, structurée et utile à la conception d'une évaluation.

Analysez attentivement le contenu des fichiers fournis

Votre tâche est de produire un contexte structuré et cohérent à partir de ce contenu.

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu'ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d’application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d'évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.
        `;

        // Generate context with uploaded files
        const startContext = performance.now();
        const contextResult = await contextModel.generateContent([
            contextPrompt,
            ...fileUploadResults.map(uploadResult => ({ fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType,
            } }))
        ]);
        const endContext = performance.now();
        modelTiming.contextTimeMs = Math.round(endContext - startContext);
        
        const contextText = contextResult.response.text();
        console.log("Phase 1 Completed: Context generated.");
        console.log("Context:", contextText);

        console.log("Starting Phase 2: Generating quiz...");

        const quizPrompt = `
Vous êtes un générateur d'évaluation intelligent. À partir d'un résumé de cours structuré, vous devez produire une évaluation de haut niveau. Vous maîtrisez la pédagogie par l’évaluation et adaptez chaque type de question au contenu traité. Vous retournez toujours un objet JSON valide et structuré.

Générez une évaluation basé sur le contexte suivant :

${contextText}

Consignes :

- Générez exactement 10 questions, couvrant l'ensemble des concepts abordés dans le contexte.
- L'ordre des questions doit être indépendant de celui des chapitres ou sections du contexte.
- Variez intelligemment les types de questions : QCM (choix multiples), questions ouvertes, compréhension de code, écriture de code.
- Le type de question doit être choisi en fonction du contenu testé :
  - Si la notion est pratique ou liée à la programmation, privilégiez la compréhension de code ou l'écriture de code.
  - Si la notion est théorique ou conceptuelle, privilégiez des QCM ou questions ouvertes.
  - Si un concept présente plusieurs facettes (théorique + pratique), vous pouvez mélanger les types ou choisir celui qui permet la meilleure évaluation de la compréhension.
- Les questions doivent être difficiles et demander une réflexion approfondie, pas simplement de la restitution de faits.
- Les questions d'écriture de code doivent fournir des exmples de résultats ou de comportements attendus.
- Évitez les questions trivia ou trop simples.
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.`;

        const quizModel = genAI.getGenerativeModel({
            model: genModel,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: quizSchema
            }
        });

        const startQuiz = performance.now();
        const quizResult = await quizModel.generateContent([
            quizPrompt
        ]);
        const endQuiz = performance.now();
        modelTiming.quizTimeMs = Math.round(endQuiz - startQuiz);

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

        console.log(`Eval created successfully for model ${genModel}`);
        console.log(`Context took ${modelTiming.contextTimeMs}ms`);
        console.log(`Quiz took ${modelTiming.quizTimeMs}ms`);

        return NextResponse.json({ context: contextText, quiz: quizText });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}