import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const fileId = parseInt(id, 10);

        const file = await prisma.file.findUnique({
            where: { id: fileId },
        });

        if (!file) {
            return NextResponse.json({ error: "Fichier pas trouvé" }, { status: 404 });
        }

        // Delete the file from disk
        try {
            await fs.unlink(file.filePath);
        } catch (fsError) {
            console.error("Impossible de trouver fichier :", fsError);
        }

        // Delete the file record in DB
        await prisma.file.delete({
            where: { id: fileId },
        });

        return NextResponse.json({ message: "Fichier supprimé avec succès" }, { status: 200 });

    } catch (error) {        
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
