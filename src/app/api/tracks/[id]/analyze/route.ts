import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';

type Params = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { analysisResult } = body;

    if (!analysisResult) {
      return NextResponse.json({ error: 'No analysis result provided' }, { status: 400 });
    }

    // Store the analysis results in the database
    const trackFeatures = await prisma.trackFeatures.upsert({
      where: { trackId: id },
      update: {
        tempo: analysisResult.tempo,
        musicalKey: analysisResult.key,
        energyLevel: analysisResult.energy,
        spectralCentroid: analysisResult.spectral?.[0] || 0,
        mfcc: analysisResult.spectral || [],
        beatPositions: analysisResult.beats || [],
        structureSegments: analysisResult.structure || [],
      },
      create: {
        trackId: id,
        tempo: analysisResult.tempo,
        musicalKey: analysisResult.key,
        energyLevel: analysisResult.energy,
        spectralCentroid: analysisResult.spectral?.[0] || 0,
        mfcc: analysisResult.spectral || [],
        beatPositions: analysisResult.beats || [],
        structureSegments: analysisResult.structure || [],
      },
    });

    // Update track duration if provided
    if (analysisResult.duration) {
      await prisma.track.update({
        where: { id },
        data: { duration: analysisResult.duration },
      });
    }

    return NextResponse.json(trackFeatures);
  } catch (error) {
    console.error('Analysis storage error:', error);
    return NextResponse.json({ error: 'Failed to store analysis' }, { status: 500 });
  }
} 