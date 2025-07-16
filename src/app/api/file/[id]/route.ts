import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const fileId = parseInt(id, 10);

        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Delete the file from disk
        try {
            await fs.unlink(file.filePath);
        } catch (fsError) {
            console.error("Failed to delete physical file:", fsError);
        }

        // Delete the file record in DB
        await prisma.file.delete({
            where: { id: fileId },
        });

        return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
