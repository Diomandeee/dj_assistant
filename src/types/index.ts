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