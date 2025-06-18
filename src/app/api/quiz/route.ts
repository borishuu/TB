import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import pdfParse from 'pdf-parse';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});

const mistralModels = [
  'mistral-large-2411',
  'open-mistral-nemo',
  'codestral-2501',
  'open-mistral-7b',
  'open-mixtral-8x7b',
  'open-mixtral-8x22b'
];

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

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const title = form.get('title') as string;
  const contentFiles = form.getAll('contentFiles') as File[];

  try {
    const { userId, error } = await verifyAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });

    if (!title) return NextResponse.json({ error: 'Quiz must have a title' }, { status: 400 });
    if (!contentFiles || contentFiles.length === 0)
      return NextResponse.json({ error: 'At least one file must be provided' }, { status: 400 });

    const fileContents: string[] = [];
    for (const file of contentFiles) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      try {
        const parsed = await pdfParse(fileBuffer);
        fileContents.push(`Fichier: ${file.name}\n\n${parsed.text}`);
      } catch (err) {
        console.warn(`Failed to parse PDF ${file.name}:`, err);
        return NextResponse.json({ error: `Failed to parse PDF file: ${file.name}` }, { status: 400 });
      }
    }

    const combinedContents = fileContents.join('\n\n---\n\n');

    const contextPromptTemplate = (combinedFileContent: string) =>`
Analysez attentivement le contenu suivant, qui provient de plusieurs fichiers :

${combinedFileContent}

Votre tâche est de produire un contexte structuré et cohérent à partir de ce contenu.

Instructions :
- Identifiez les principaux thèmes et concepts abordés dans les fichiers, qu’ils soient théoriques ou pratiques.
- Pour chaque notion ou sujet important, incluez les informations pertinentes associées : définitions, explications, exemples, contextes d’application, etc.
- Mélangez intelligemment les contenus issus des différents fichiers.
- Mettez en avant les éléments particulièrement utiles pour la génération d’évaluations (concepts, procédures, points de difficulté, distinctions à connaître).
- Organisez le contenu de manière lisible, avec des titres, sous-titres, ou listes si nécessaire.

Objectif : produire un contexte qui permettrait à une IA de recevoir le contexte des fichiers et de concevoir des questions pertinentes à partir de ce contenu.

`;

    const quizPromptTemplate = (contextText: string) => `
Générez une évaluation basé sur le contexte suivant :

${contextText}

Consignes :

- Générez exactement 10 questions, couvrant l'ensemble des concepts abordés dans le contexte.
- L'ordre des questions doit être indépendant de celui des chapitres ou sections du contexte.
- Variez intelligemment les types de questions : QCM (choix multiples), questions ouvertes, compréhension de code, écriture de code.
- Le type de question doit être choisi en fonction du contenu testé :
  - Si la notion est pratique ou liée à la programmation, privilégiez la compréhension de code ou l’écriture de code.
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

    const results: any[] = [];

    const contextPrompt = contextPromptTemplate(combinedContents);
    for (const model of mistralModels) {
      try {
        // Générer le contexte avec ce modèle
        const contextResponse = await mistral.chat.complete({
          model,
          messages: [
            {
              role: 'system',
              content: `Vous êtes un assistant pédagogique expert. Votre objectif est d'analyser du contenu de cours brut pour en extraire un contexte claire, structurée et utile à la conception d'une évaluation.`
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
        });

        const contextText = contextResponse.choices[0]?.message?.content ?? '';
        const quizPrompt = quizPromptTemplate(contextText as string);

        // Générer le quiz à partir de ce contexte
        const quizResponse = await mistral.chat.complete({
          model,
          messages: [
            {
              role: 'system',
              content: `Vous êtes un générateur d'évaluation intelligent. À partir d'un résumé de cours structuré, vous devez produire une évaluation de haut niveau. Vous maîtrisez la pédagogie par l’évaluation et adaptez chaque type de question au contenu traité. Vous retournez toujours un objet JSON valide et structuré.`
            },
            {
              role: 'user',
              content: quizPrompt
            }
          ],
          responseFormat: { type: 'json_object' },
        });

        const quizText = quizResponse.choices[0]?.message?.content ?? '';
        const parsedQuiz = JSON.parse(quizText as string);
        const sanitizedQuiz = deepSanitize(parsedQuiz);

        await prisma.quiz.create({
          data: {
            title: `${title} (${model})`,
            content: sanitizedQuiz,
            prompts: {
              contextPrompt: contextPromptTemplate('file values'),
              quizPrompt: quizPromptTemplate('context text')
            },
            genModel: model,
            author: { connect: { id: userId as number } },
          },
        });

        console.log(`Eval created successfully for model ${model}`);
        console.log('context:', contextText);
        results.push({ model, status: 'ok' });
      } catch (err) {
        console.error(`Error for model ${model}:`, err);
        results.push({ model, status: 'error', message: (err as Error).message });
      }
    }

    return NextResponse.json({ results });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
