import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama2:latest';

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
    const contextPrompt = `
Analysez le contenu suivant et générez un résumé structuré des concepts clés abordés :
${combinedText}

Consignes :
- Reformulez et synthétisez.
- Structurez par thème.
- Présentez sous forme de résumé clair pour la génération de quiz.
    `;
    const contextText = await queryOllama(contextPrompt);
    console.log("Context Generated:\n", contextText);

    console.log("Starting Phase 2: Generating quiz...");
    const quizPrompt = `
En vous basant sur le résumé suivant, générez un quiz structuré au format JSON.

Résumé :
${contextText}

Consignes :
- 10 questions minimum
- Types variés : "mcq", "open", "codeComprehension", "codeWriting"
- Format JSON strict :
{
  "content": [
    {
      "number": "1",
      "questionText": "...",
      "questionType": "mcq",
      "options": ["A", "B", "C"],
      "correctAnswer": "A",
      "explanation": "..."
    },
    ...
  ]
}
    `;
    const quizText = await queryOllama(quizPrompt);

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
        content: quizJSON,
        prompts: {
          contextPrompt,
          quizPrompt,
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
