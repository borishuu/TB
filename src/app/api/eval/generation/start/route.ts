import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { setProgress } from '@/lib/progressStore';

export async function POST(request: NextRequest) {
  const generationId = uuidv4();
  setProgress(generationId, 'start');

  return NextResponse.json({ generationId });
}
