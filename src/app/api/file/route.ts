import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const courseId = form.get('courseId') as string;
  const contentFiles = form.getAll('files') as File[];

  try {
    if (!contentFiles || contentFiles.length === 0) {
      console.log("No files provided");
      return NextResponse.json({ error: "Files must be provided" }, { status: 400 });
    }

    const insertedFileNames: string[] = [];

    for (const file of contentFiles) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      try {
        // Parse text content from PDF
        const parsed = await pdfParse(fileBuffer);

        // Remove NULL bytes
        const cleanedText = parsed.text.replace(/\u0000/g, '');

        // Save file to disk
        const uploadDir = path.join(process.cwd(), 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, fileBuffer);

        // Insert into DB
        await prisma.file.create({
          data: {
            fileName: file.name,
            mimeType: file.type,
            fileSize: fileBuffer.length,
            filePath,
            textContent: cleanedText,
            courseId: parseInt(courseId, 10),
          },
        });

        insertedFileNames.push(file.name);
      } catch (err) {
        console.error("Error processing file:", file.name, err);
        return NextResponse.json({ error: `Failed to parse PDF file: ${file.name}` }, { status: 400 });
      }
    }

    // Fetch inserted files
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
