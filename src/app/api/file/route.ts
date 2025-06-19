import {NextRequest, NextResponse} from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(request: NextRequest) {
    console.log("POST /api/file");
    const form = await request.formData();

    const course = form.get('course') as string;
    const contentFiles = form.getAll('files') as File[];

    try {

        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        if (!contentFiles || contentFiles.length === 0) {
            return NextResponse.json({ error: "Files must be provided" }, { status: 400 });
        }

        for (const file of contentFiles) {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          try {
            const parsed = await pdfParse(fileBuffer);
            const response = await genAI.models.embedContent({
                contents: parsed.text,
                model: 'gemini-embedding-exp-03-07',
            });
      
            console.log((response.embeddings as any))

            // Save file to disk
            const uploadDir = path.join(process.cwd(), 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, file.name);
            await fs.writeFile(filePath, fileBuffer);

            const embeddingArray = (response.embeddings as any)[0].values;
            const embeddingString = `[${embeddingArray.join(',')}]`;

            await prisma.$executeRawUnsafe(`
            INSERT INTO "File" (
                "fileName", "mimeType", "fileSize", "filePath", "embedding", "courseId"
            ) VALUES (
                '${file.name}', '${file.type}', ${fileBuffer.length}, '${filePath}', '${embeddingString}', 2
            )
            `);


          } catch (err) {
            console.warn(`Failed to parse PDF ${file.name}:`, err);
            return NextResponse.json({ error: `Failed to parse PDF file: ${file.name}` }, { status: 400 });
          }
        }

        /**/

        return NextResponse.json({ message: "success" });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}