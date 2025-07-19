import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // For now, we'll create a basic track record without actual audio analysis
    // The client-side AudioAnalyzer will handle the analysis
    const track = await prisma.track.create({
      data: {
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        filePath: `/uploads/${file.name}`, // You'll need to implement file storage
        duration: 0, // Placeholder - would be set after analysis
      }
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        features: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Fetch tracks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
  }
} 