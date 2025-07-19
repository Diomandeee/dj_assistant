import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';

export async function GET() {
  try {
    // Get all tracks with their features
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
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' }, 
      { status: 500 }
    );
  }
} 