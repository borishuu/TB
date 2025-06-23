import {NextRequest, NextResponse} from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/verifyAuth';
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function POST(request: NextRequest) {
    const form = await request.formData();

    const topics = form.get('topics') as string;

    try {

        // Ensure only a logged in user can call this route
        const { userId, error } = await verifyAuth(request);

        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        if (!topics) {
            return NextResponse.json({ error: "No topics to do a similarity search" }, { status: 400 });
        }

        const embeddingResponse = await genAI.models.embedContent({
            contents: topics,
            model: 'gemini-embedding-exp-03-07',
        });
          
        const topicEmbedding = (embeddingResponse.embeddings as any)[0].values;

        // Convert the JS array to a SQL compatible string
        const embeddingSql = `ARRAY[${topicEmbedding.join(',')}]::vector`;


        const results = await prisma.$queryRawUnsafe(`
            SELECT
                "id",
                "fileName",
                "mimeType",
                "fileSize",
                "filePath",
                "courseId",
                "createdAt",
                ("embedding" <=> ${embeddingSql}) AS similarity
            FROM "File"
            ORDER BY similarity ASC
            LIMIT 5;
        `);        

        console.log("Similarity search results:", results);

        return NextResponse.json({ files: results });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to login" }, { status: 500 });
    }
}