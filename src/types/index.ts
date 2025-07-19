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
  tempo?: number | null;
  musicalKey?: string | null;
  energyLevel?: number | null;
  loudness?: number | null;
  danceability?: number | null;
  valence?: number | null;
  spectralCentroid?: number | null;
  spectralRolloff?: number | null;
  zeroCrossingRate?: number | null;
  mfcc?: number[] | null;
  chroma?: number[] | null;
  beatPositions?: number[] | null;
  structureSegments?: StructureSegment[] | null;
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

export interface AudioAnalysisResult {
  tempo: number;
  key: string;
  energy: number;
  spectral: number[];
  beats: number[];
  structure: StructureSegment[];
}

export interface PlaylistGenerationRequest {
  seedTrackId: string;
  preferences?: Partial<UserPreferences>;
  playlistLength?: number;
} 