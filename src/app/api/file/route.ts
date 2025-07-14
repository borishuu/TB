import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const courseId = form.get('courseId') as string;
  const contentFiles = form.getAll('files') as File[];

  try {
    const { userId, error } = await verifyAuth(request);

    if (error) {
      return NextResponse.json({ error }, { status: 401 });
    }

    if (!contentFiles || contentFiles.length === 0) {
      return NextResponse.json({ error: "Files must be provided" }, { status: 400 });
    }

    const insertedFileNames: string[] = [];

    for (const file of contentFiles) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      try {
        const parsed = await pdfParse(fileBuffer);
        const response = await genAI.models.embedContent({
          contents: parsed.text,
          model: 'gemini-embedding-exp-03-07',
        });

        const embeddingArray = (response.embeddings as any)[0].values;
        const embeddingString = `[${embeddingArray.join(',')}]`;

        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, fileBuffer);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "File" (
            "fileName", "mimeType", "fileSize", "filePath", "embedding", "courseId"
          ) VALUES (
            '${file.name}', '${file.type}', ${fileBuffer.length}, '${filePath}', '${embeddingString}', ${courseId}
          )
        `);

        insertedFileNames.push(file.name);
      } catch (err) {
        console.warn(`Failed to parse PDF ${file.name}:`, err);
        return NextResponse.json({ error: `Failed to parse PDF file: ${file.name}` }, { status: 400 });
      }
    }

    // Fetch the inserted files
    const insertedFiles = await prisma.file.findMany({
        where: {
          fileName: { in: insertedFileNames },
          courseId: parseInt(courseId, 10),
        },
        include: {
          course: true, 
        },
      });
      

    return NextResponse.json(insertedFiles, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
