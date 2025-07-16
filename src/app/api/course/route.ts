import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    
    try {
        const courses = await prisma.course.findMany({});
        return NextResponse.json(courses, { status: 200 });
         
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    } finally {
    }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { name } = body;
  
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Invalid course name' }, { status: 400 });
      }
  
      // Check if course with this name already exists to avoid duplicates
      const existing = await prisma.course.findFirst({
        where: {
          courseName: name.trim(),
        },
      });
  
      if (existing) {
        return NextResponse.json({ error: 'Course with this name already exists' }, { status: 409 });
      }
  
      const newCourse = await prisma.course.create({
        data: {
            courseName: name.trim(),
        },
      });
  
      return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
      console.error('Error creating course:', error);
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
  }
  