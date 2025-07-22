import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {
        const courses = await prisma.course.findMany({});
        return NextResponse.json(courses, { status: 200 });
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Erreur dans la récupération des cours" }, { status: 500 });
    } finally {
    }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { name } = body;
  
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Nom de cours invalide' }, { status: 400 });
      }
  
      // Check if course with this name already exists to avoid duplicates
      const existing = await prisma.course.findFirst({
        where: {
          courseName: name.trim(),
        },
      });
  
      if (existing) {
        return NextResponse.json({ error: 'Un cours avec le même nom exist déjà' }, { status: 409 });
      }
  
      const newCourse = await prisma.course.create({
        data: {
            courseName: name.trim(),
        },
      });
  
      return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  }
  