import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';


export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const evalId = parseInt(id, 10);
  
      if (isNaN(evalId)) {
        return NextResponse.json({ error: "ID d'évaluation invalide" }, { status: 400 });
      }
  
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const courseIdRaw = formData.get('courseId') as string;
  
      if (!title || !courseIdRaw) {
        return NextResponse.json({ error: "Titre ou courseId manquant" }, { status: 400 });
      }
  
      const courseId = parseInt(courseIdRaw, 10);
      if (isNaN(courseId)) {
        return NextResponse.json({ error: "courseId invalide" }, { status: 400 });
      }
  
      const updatedEval = await prisma.evaluation.update({
        where: { id: evalId },
        data: {
          title,
          courseId,
        },
        include: {
            course: true,
            versions: true,
        }
      });
  
      return NextResponse.json(updatedEval, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }
  