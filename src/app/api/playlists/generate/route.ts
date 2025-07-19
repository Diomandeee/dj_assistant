import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';
import { TrackComparator } from '@/lib/audio/comparison';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seedTrackId, preferences, playlistLength = 10 } = body;

    if (!seedTrackId) {
      return NextResponse.json({ error: 'Seed track ID is required' }, { status: 400 });
    }

    // Get the seed track with features
    const seedTrack = await prisma.track.findUnique({
      where: { id: seedTrackId },
      include: { features: true }
    });

    if (!seedTrack || !seedTrack.features) {
      return NextResponse.json({ error: 'Seed track not found or not analyzed' }, { status: 404 });
    }

    // Get all other tracks with features for comparison
    const candidateTracks = await prisma.track.findMany({
      where: {
        id: { not: seedTrackId },
        features: { isNot: null }
      },
      include: { features: true }
    });

    if (candidateTracks.length === 0) {
      return NextResponse.json({ error: 'No compatible tracks found' }, { status: 404 });
    }

    // Use the track comparator to find compatible tracks
    const comparator = new TrackComparator();
    const compatibleTracks = comparator.findCompatibleTracks(
      seedTrack.features,
      candidateTracks.map(t => t.features!),
      playlistLength - 1 // Exclude seed track from count
    );

    // Build playlist starting with seed track
    const playlistTracks = [
      {
        track: seedTrack,
        position: 0,
        compatibilityScore: null
      },
      ...compatibleTracks.map((item, index) => {
        // Find the full track data
        const fullTrack = candidateTracks.find(t => t.features!.id === item.track.id);
        return {
          track: fullTrack!,
          position: index + 1,
          compatibilityScore: item.score
        };
      })
    ];

    // Create playlist record in database
    const playlist = await prisma.playlist.create({
      data: {
        name: `Generated from ${seedTrack.title}`,
        seedTrackId: seedTrackId,
        trackOrder: playlistTracks.map(item => ({
          trackId: item.track.id,
          position: item.position,
          score: item.compatibilityScore?.overall || 1.0
        })),
        transitionInstructions: [] // Placeholder for transition instructions
      }
    });

    return NextResponse.json({
      id: playlist.id,
      name: playlist.name,
      tracks: playlistTracks,
      seedTrack: seedTrack,
      createdAt: playlist.createdAt
    });

  } catch (error) {
    console.error('Playlist generation error:', error);
    return NextResponse.json({ error: 'Failed to generate playlist' }, { status: 500 });
  }
} 