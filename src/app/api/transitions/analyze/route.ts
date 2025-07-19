import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';
import { TrackFeatures, StructureSegment } from '@/types';
import { TransitionOptimizer } from '@/lib/audio/transition-optimizer';
import { Prisma } from '@prisma/client';

// Type for Prisma track features with JSON values
type PrismaTrackFeatures = {
  id: string;
  trackId: string;
  tempo: number | null;
  musicalKey: string | null;
  energyLevel: number | null;
  loudness: number | null;
  danceability: number | null;
  valence: number | null;
  spectralCentroid: number | null;
  spectralRolloff: number | null;
  zeroCrossingRate: number | null;
  mfcc: Prisma.JsonValue;
  chroma: Prisma.JsonValue;
  beatPositions: Prisma.JsonValue;
  structureSegments: Prisma.JsonValue;
  createdAt: Date;
};

// Helper functions for safe type conversion
function safeNumberArray(value: Prisma.JsonValue): number[] | null {
  return Array.isArray(value) && value.every(item => typeof item === 'number') ? value as number[] : null;
}

function safeStructureSegments(value: Prisma.JsonValue): StructureSegment[] | null {
  return Array.isArray(value) ? value as unknown as StructureSegment[] : null;
}

// Convert Prisma data to our TypeScript interface
function convertPrismaToTrackFeatures(prismaFeatures: PrismaTrackFeatures): TrackFeatures {
  return {
    id: prismaFeatures.id,
    trackId: prismaFeatures.trackId,
    tempo: prismaFeatures.tempo,
    musicalKey: prismaFeatures.musicalKey,
    energyLevel: prismaFeatures.energyLevel,
    loudness: prismaFeatures.loudness,
    danceability: prismaFeatures.danceability,
    valence: prismaFeatures.valence,
    spectralCentroid: prismaFeatures.spectralCentroid,
    spectralRolloff: prismaFeatures.spectralRolloff,
    zeroCrossingRate: prismaFeatures.zeroCrossingRate,
    mfcc: safeNumberArray(prismaFeatures.mfcc),
    chroma: safeNumberArray(prismaFeatures.chroma),
    beatPositions: safeNumberArray(prismaFeatures.beatPositions),
    structureSegments: safeStructureSegments(prismaFeatures.structureSegments),
    createdAt: prismaFeatures.createdAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromTrackId, toTrackId } = body;

    if (!fromTrackId || !toTrackId) {
      return NextResponse.json(
        { error: 'Both fromTrackId and toTrackId are required' }, 
        { status: 400 }
      );
    }

    // Get both tracks with their features
    const [fromTrack, toTrack] = await Promise.all([
      prisma.track.findUnique({
        where: { id: fromTrackId },
        include: { features: true }
      }),
      prisma.track.findUnique({
        where: { id: toTrackId },
        include: { features: true }
      })
    ]);

    if (!fromTrack || !fromTrack.features) {
      return NextResponse.json(
        { error: 'From track not found or not analyzed' }, 
        { status: 404 }
      );
    }

    if (!toTrack || !toTrack.features) {
      return NextResponse.json(
        { error: 'To track not found or not analyzed' }, 
        { status: 404 }
      );
    }

    // Convert to our TypeScript interfaces
    const fromFeatures = convertPrismaToTrackFeatures(fromTrack.features);
    const toFeatures = convertPrismaToTrackFeatures(toTrack.features);

    // Analyze transition
    const optimizer = new TransitionOptimizer();
    const analysis = optimizer.analyzeTransition(fromFeatures, toFeatures);
    const instructions = optimizer.generateMixingInstructions(analysis, fromFeatures, toFeatures);

    return NextResponse.json({
      fromTrack: {
        id: fromTrack.id,
        title: fromTrack.title,
        artist: fromTrack.artist,
        tempo: fromFeatures.tempo,
        key: fromFeatures.musicalKey
      },
      toTrack: {
        id: toTrack.id,
        title: toTrack.title,
        artist: toTrack.artist,
        tempo: toFeatures.tempo,
        key: toFeatures.musicalKey
      },
      analysis,
      instructions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Transition analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transition' }, 
      { status: 500 }
    );
  }
} 