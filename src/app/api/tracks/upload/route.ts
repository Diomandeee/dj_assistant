import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File; // Changed from 'file' to 'audio'
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No audio file provided',
        details: 'Please select an audio file to upload'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-wav'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: 'Please upload MP3, WAV, or M4A files only'
      }, { status: 400 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large',
        details: `File size must be under 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`
      }, { status: 400 });
    }

    // Check if file is empty
    if (file.size === 0) {
      return NextResponse.json({ 
        error: 'Empty file',
        details: 'The uploaded file appears to be empty'
      }, { status: 400 });
    }

    // Create a track record in the database
    const track = await prisma.track.create({
      data: {
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
        filePath: `/uploads/${Date.now()}-${file.name}`, // Unique file path
        duration: 0, // Will be updated after analysis
      }
    });

    return NextResponse.json({ 
      trackId: track.id,
      track,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Duplicate file',
          details: 'A track with this name already exists'
        }, { status: 409 });
      }
    }

    return NextResponse.json({ 
      error: 'Upload failed',
      details: 'An unexpected error occurred during upload'
    }, { status: 500 });
  }
} 