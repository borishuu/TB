import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'codestral:latest';


const contextPromptTemplate = (combinedFileContent: string) =>`
Analysez attentivement le contenu suivant, qui provient de plusieurs fichiers :

${combinedFileContent}

Votre tâche est de produire un contexte structuré et cohérent à partir de ce contenu.

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu'ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d’application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d'évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.

`;

const quizPromptTemplate = (contextText: string) => `
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
- Retournez uniquement un objet JSON strictement valide contenant les données de l'évaluation.
- Le format JSON doit être conforme à l'exemple suivant :

Exemple :
{
  "content": [
    {
      "number": "Q1",
      "questionText": "Qu'est-ce que la récursion ?",
      "questionType": "open",
      "options": [],
      "correctAnswer": "La récursion est une méthode où une fonction s'appelle elle-même.",
      "explanation": "La récursion permet de résoudre un problème en le divisant en sous-problèmes similaires."
    },
    {
      "number": "Q2",
      "questionText": "Quelle est la sortie du code suivant ?\\n\\nfunction f(n) {\\n  if (n <= 1) return 1;\\n  return n * f(n - 1);\\n}\\nf(3);",
      "questionType": "codeComprehension",
      "options": [],
      "correctAnswer": "6",
      "explanation": "La fonction calcule la factorielle : f(3) = 3 * 2 * 1 = 6."
    },
    {
      "number": "Q3",
      "questionText": "Choisissez les bonnes réponses concernant la récursion.",
      "questionType": "mcq",
      "options": [
        "Elle nécessite toujours une condition d'arrêt.",
        "Elle est plus rapide que l'itération dans tous les cas.",
        "Elle peut mener à un dépassement de pile si mal utilisée.",
        "Elle ne peut pas être utilisée pour parcourir des structures arborescentes."
      ],
      "correctAnswer": "Elle nécessite toujours une condition d'arrêt.; Elle peut mener à un dépassement de pile si mal utilisée.",
      "explanation": "Sans condition d'arrêt, la récursion boucle à l'infini et cause un dépassement de pile."
    }
  ]
}
`;

function deepSanitize(value: any): any {
    if (typeof value === 'string') {
      return value.replace(/\u0000/g, '');
    }
    if (Array.isArray(value)) {
      return value.map(deepSanitize);
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = deepSanitize(value[key]);
      }
      return sanitized;
    }
    return value;
}

async function queryOllama(prompt: string): Promise<string> {
  const res = await fetch(OLLAMA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error: ${errText}`);
  }

  const data = await res.json();
  return data.response.trim();
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.promises.readFile(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const title = form.get('title') as string;
  const contentFiles = form.getAll("contentFiles") as File[];
  const suggestedFileIds = form.getAll("suggestedFileIds").map(id => Number(id));

  try {
    const { userId, error } = await verifyAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!title) return NextResponse.json({ error: "Quiz must have a title" }, { status: 400 });
    if ((!contentFiles || contentFiles.length === 0) && suggestedFileIds.length === 0) {
      return NextResponse.json({ error: "At least one file must be provided" }, { status: 400 });
    }

    let poolFiles: { fileName: string, filePath: string }[] = [];

    if (suggestedFileIds.length > 0) {
      const results = await prisma.file.findMany({
        where: { id: { in: suggestedFileIds } },
        select: { fileName: true, filePath: true },
      });
      poolFiles = results;
    }

    const allFiles = [...contentFiles, ...poolFiles];
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    let combinedText = '';

    for (const file of allFiles) {
      let filePath: string;

      if (file instanceof File) {
        const buffer = await file.arrayBuffer();
        filePath = path.join(tmpDir, file.name);
        await fs.promises.writeFile(filePath, Buffer.from(buffer));
      } else {
        filePath = file.filePath;
      }

      const text = await extractTextFromPDF(filePath);
      combinedText += `\n\n-----\n${text}`;
      if (file instanceof File) await fs.promises.unlink(filePath); // clean up tmp
    }

    console.log("Starting Phase 1: Generating context...");

    const contextPrompt = contextPromptTemplate(combinedText);
    const contextText = await queryOllama(contextPrompt);
    console.log("Context Generated:\n", contextText);

    console.log("Starting Phase 2: Generating quiz...");

    const quizPrompt = quizPromptTemplate(contextText);
    const quizText = await queryOllama(quizPrompt);
    const parsedQuiz = JSON.parse(quizText);
    const sanitizedQuiz = deepSanitize(parsedQuiz);

    let quizJSON;
    try {
      quizJSON = JSON.parse(quizText);
    } catch (err) {
      console.error("Quiz generation failed: Invalid JSON", quizText);
      return NextResponse.json({ error: "Generated quiz is not valid JSON" }, { status: 500 });
    }

    console.log(quizJSON);

    await prisma.quiz.create({
      data: {
        title,
        content: sanitizedQuiz,
        prompts: {
          contextPrompt: contextPromptTemplate('context text'),
          quizPrompt: quizPromptTemplate('file values'),
        },
        genModel: OLLAMA_MODEL,
        author: { connect: { id: userId as number } },
      },
    });

    return NextResponse.json({ context: contextText, quiz: quizText });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
