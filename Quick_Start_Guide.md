# DJ Assistant - Quick Start Guide

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or later)
- **npm** or **yarn**
- **PostgreSQL** (local or cloud instance)
- **Redis** (for caching)
- **Git**

## Initial Setup

### 1. Create Next.js Project

```bash
# Create new Next.js project with TypeScript
npx create-next-app@latest dj-assistant --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project directory
cd dj-assistant
```

### 2. Install Required Dependencies

```bash
# Core dependencies
npm install prisma @prisma/client
npm install redis
npm install socket.io socket.io-client
npm install framer-motion
npm install uuid
npm install multer

# Audio processing libraries
npm install tone
npm install ml5
npm install music-theory

# Development dependencies
npm install -D @types/multer @types/uuid
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D prisma
```

### 3. Environment Configuration

Create `.env.local` file in project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dj_assistant"

# Redis
REDIS_URL="redis://localhost:6379"

# Audio processing
MAX_FILE_SIZE=50MB
UPLOAD_PATH="./uploads"

# Security
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Development
NODE_ENV="development"
```

### 4. Database Setup

Initialize Prisma:

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Track {
  id          String   @id @default(cuid())
  filename    String
  title       String?
  artist      String?
  duration    Float?
  filePath    String   @map("file_path")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  features    TrackFeatures?
  playlists   Playlist[]

  @@map("tracks")
}

model TrackFeatures {
  id                String   @id @default(cuid())
  trackId           String   @unique @map("track_id")
  tempo             Float?
  musicalKey        String?  @map("musical_key")
  energyLevel       Float?   @map("energy_level")
  loudness          Float?
  danceability      Float?
  valence           Float?
  spectralCentroid  Float?   @map("spectral_centroid")
  spectralRolloff   Float?   @map("spectral_rolloff")
  zeroCrossingRate  Float?   @map("zero_crossing_rate")
  mfcc              Json?
  chroma            Json?
  beatPositions     Json?    @map("beat_positions")
  structureSegments Json?    @map("structure_segments")
  createdAt         DateTime @default(now()) @map("created_at")

  track             Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@map("track_features")
}

model UserPreferences {
  id                        String   @id @default(cuid())
  userId                    String?  @map("user_id")
  transitionLengthPref      String?  @map("transition_length_preference")
  energyProgression         String?  @map("energy_progression")
  keyRelationshipPref       String?  @map("key_relationship_preference")
  tempoVarianceTolerance    Float?   @map("tempo_variance_tolerance")
  preferredTransitionTypes  Json?    @map("preferred_transition_types")
  createdAt                 DateTime @default(now()) @map("created_at")
  updatedAt                 DateTime @updatedAt @map("updated_at")

  @@map("user_preferences")
}

model Playlist {
  id                      String   @id @default(cuid())
  name                    String?
  seedTrackId             String   @map("seed_track_id")
  trackOrder              Json?    @map("track_order")
  transitionInstructions  Json?    @map("transition_instructions")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  seedTrack               Track    @relation(fields: [seedTrackId], references: [id])

  @@map("playlists")
}
```

### 5. Project Structure Setup

Create the following directory structure:

```bash
src/
├── app/
│   ├── api/
│   │   ├── tracks/
│   │   ├── playlists/
│   │   └── preferences/
│   ├── components/
│   │   ├── audio-analyzer/
│   │   ├── track-comparison/
│   │   ├── transition-optimizer/
│   │   ├── playlist-generator/
│   │   └── ui/
│   ├── lib/
│   │   ├── audio/
│   │   ├── database/
│   │   └── utils/
│   └── types/
```

### 6. Core Type Definitions

Create `src/types/index.ts`:

```typescript
export interface Track {
  id: string;
  filename: string;
  title?: string;
  artist?: string;
  duration?: number;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  features?: TrackFeatures;
}

export interface TrackFeatures {
  id: string;
  trackId: string;
  tempo?: number;
  musicalKey?: string;
  energyLevel?: number;
  loudness?: number;
  danceability?: number;
  valence?: number;
  spectralCentroid?: number;
  spectralRolloff?: number;
  zeroCrossingRate?: number;
  mfcc?: number[];
  chroma?: number[];
  beatPositions?: number[];
  structureSegments?: StructureSegment[];
  createdAt: Date;
}

export interface StructureSegment {
  start: number;
  end: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
  confidence: number;
}

export interface CompatibilityScore {
  overall: number;
  tempo: number;
  key: number;
  energy: number;
  spectral: number;
  rhythm: number;
}

export interface TransitionPoint {
  fromTrackTime: number;
  toTrackTime: number;
  score: number;
  type: 'beatmatch' | 'echo_out' | 'filter_fade' | 'quick_cut';
  length: number;
  confidence: number;
}

export interface PlaylistItem {
  track: Track;
  position: number;
  transitionTo?: TransitionPoint;
}

export interface UserPreferences {
  transitionLengthPreference: 'short' | 'medium' | 'long';
  energyProgression: 'build' | 'maintain' | 'vary';
  keyRelationshipPreference: 'harmonic' | 'chromatic' | 'any';
  tempoVarianceTolerance: number;
  preferredTransitionTypes: string[];
}
```

### 7. Database Connection

Create `src/lib/database/connection.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 8. Basic Audio Analyzer

Create `src/lib/audio/analyzer.ts`:

```typescript
export class AudioAnalyzer {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async analyzeFile(file: File): Promise<TrackFeatures> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Extract basic features
    const tempo = await this.extractTempo(audioBuffer);
    const key = await this.extractKey(audioBuffer);
    const energy = await this.extractEnergy(audioBuffer);
    
    return {
      tempo,
      musicalKey: key,
      energyLevel: energy,
      // ... other features
    } as TrackFeatures;
  }

  private async extractTempo(audioBuffer: AudioBuffer): Promise<number> {
    // Implement tempo detection algorithm
    // This is a placeholder - you'll need to implement actual BPM detection
    return 120; // Default BPM
  }

  private async extractKey(audioBuffer: AudioBuffer): Promise<string> {
    // Implement key detection algorithm
    // This is a placeholder - you'll need to implement actual key detection
    return 'C'; // Default key
  }

  private async extractEnergy(audioBuffer: AudioBuffer): Promise<number> {
    // Calculate RMS energy
    const channelData = audioBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }
}
```

### 9. API Routes

Create `src/app/api/tracks/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';
import { AudioAnalyzer } from '@/lib/audio/analyzer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Analyze the audio file
    const analyzer = new AudioAnalyzer();
    const features = await analyzer.analyzeFile(file);

    // Save track to database
    const track = await prisma.track.create({
      data: {
        filename: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        filePath: `/uploads/${file.name}`, // You'll need to implement file storage
        features: {
          create: features
        }
      },
      include: {
        features: true
      }
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 10. Basic UI Components

Create `src/app/components/ui/TrackUploader.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Track } from '@/types';

interface TrackUploaderProps {
  onTrackUploaded: (track: Track) => void;
}

export function TrackUploader({ onTrackUploaded }: TrackUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const track = await response.json();
        onTrackUploaded(track);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        disabled={isUploading}
        className="mb-4"
      />
      {isUploading && <p>Analyzing audio...</p>}
    </div>
  );
}
```

### 11. Main Page

Update `src/app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { TrackUploader } from './components/ui/TrackUploader';
import { Track } from '@/types';

export default function Home() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);

  const handleTrackUploaded = (track: Track) => {
    console.log('Track uploaded:', track);
    // You can set this as the seed track or add to library
  };

  const handleGeneratePlaylist = async () => {
    if (!selectedTrack) return;
    
    try {
      const response = await fetch('/api/playlists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedTrackId: selectedTrack.id }),
      });
      
      if (response.ok) {
        const generatedPlaylist = await response.json();
        setPlaylist(generatedPlaylist.tracks);
      }
    } catch (error) {
      console.error('Playlist generation failed:', error);
    }
  };

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">DJ Assistant</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Track</h2>
          <TrackUploader onTrackUploaded={handleTrackUploaded} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Playlist</h2>
          <div className="space-y-2">
            {playlist.map((track, index) => (
              <div key={track.id} className="p-3 bg-gray-100 rounded">
                {index + 1}. {track.title} - {track.artist}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
```

## Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Test the basic functionality:**
   - Upload an audio file
   - Verify it appears in the database
   - Check that basic features are extracted

## Next Steps

1. **Implement audio analysis algorithms** (Phase 2)
2. **Build track comparison system** (Phase 3)
3. **Add transition optimization** (Phase 4)
4. **Enhance the UI** (Phase 6)
5. **Add real-time features** (Phase 7)

## Troubleshooting

### Common Issues

1. **Audio Context Error:**
   - Ensure user interaction before creating AudioContext
   - Check browser compatibility

2. **Database Connection:**
   - Verify PostgreSQL is running
   - Check connection string in `.env.local`

3. **File Upload Issues:**
   - Implement proper file storage (local or cloud)
   - Configure file size limits

4. **Audio Processing:**
   - Consider using Web Workers for heavy processing
   - Implement proper error handling for unsupported formats

This quick start guide gets you up and running with the basic infrastructure. Follow the detailed implementation plan to build out the full system functionality. 