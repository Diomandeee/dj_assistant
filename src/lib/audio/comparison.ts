import { TrackFeatures, CompatibilityScore } from '@/types';

export class TrackComparator {
  
  calculateCompatibility(track1: TrackFeatures, track2: TrackFeatures): CompatibilityScore {
    const tempo = this.calculateTempoCompatibility(track1.tempo ?? 120, track2.tempo ?? 120);
    const key = this.calculateKeyCompatibility(track1.musicalKey ?? 'C', track2.musicalKey ?? 'C');
    const energy = this.calculateEnergyCompatibility(track1.energyLevel ?? 0.5, track2.energyLevel ?? 0.5);
    const spectral = this.calculateSpectralCompatibility(track1.spectralCentroid ?? 0, track2.spectralCentroid ?? 0);
    const rhythm = this.calculateRhythmCompatibility(track1, track2);

    // Weighted overall compatibility
    const weights = {
      tempo: 0.3,
      key: 0.25,
      energy: 0.2,
      spectral: 0.15,
      rhythm: 0.1
    };

    const overall = (
      tempo * weights.tempo +
      key * weights.key +
      energy * weights.energy +
      spectral * weights.spectral +
      rhythm * weights.rhythm
    );

    return {
      overall,
      tempo,
      key,
      energy,
      spectral,
      rhythm
    };
  }

  private calculateTempoCompatibility(bpm1: number, bpm2: number): number {
    const difference = Math.abs(bpm1 - bpm2);
    
    if (difference === 0) return 1.0;
    if (difference <= 5) return 0.8;
    if (difference <= 10) return 0.6;
    if (difference <= 20) return 0.4;
    return 0.2;
  }

  private calculateKeyCompatibility(key1: string, key2: string): number {
    // Circle of fifths compatibility
    const circleOfFifths: Record<string, number> = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
      'F#': 6, 'C#': 7, 'G#': 8, 'D#': 9, 'A#': 10, 'F': 11,
      'Cm': 12, 'Gm': 13, 'Dm': 14, 'Am': 15, 'Em': 16, 'Bm': 17,
      'F#m': 18, 'C#m': 19, 'G#m': 20, 'D#m': 21, 'A#m': 22, 'Fm': 23
    };

    const pos1 = circleOfFifths[key1] ?? 0;
    const pos2 = circleOfFifths[key2] ?? 0;
    
    // Calculate distance on circle (considering it wraps around)
    const distance = Math.min(
      Math.abs(pos1 - pos2),
      Math.abs(pos1 - pos2 + 12),
      Math.abs(pos1 - pos2 - 12)
    );

    if (distance === 0) return 1.0; // Same key
    if (distance <= 1) return 0.8; // Adjacent keys
    if (distance <= 2) return 0.6; // Close keys
    if (distance <= 3) return 0.4; // Somewhat compatible
    return 0.2; // Less compatible
  }

  private calculateEnergyCompatibility(energy1: number, energy2: number): number {
    const difference = Math.abs(energy1 - energy2);
    return Math.max(0, 1 - difference * 2); // Linear decay
  }

  private calculateSpectralCompatibility(spectral1: number, spectral2: number): number {
    const difference = Math.abs(spectral1 - spectral2);
    const normalized = difference / Math.max(spectral1, spectral2, 1);
    return Math.max(0, 1 - normalized);
  }

  private calculateRhythmCompatibility(track1: TrackFeatures, track2: TrackFeatures): number {
    // Use tempo similarity as rhythm compatibility proxy
    const tempo1 = track1.tempo ?? 120;
    const tempo2 = track2.tempo ?? 120;
    
    const tempoRatio = Math.min(tempo1, tempo2) / Math.max(tempo1, tempo2);
    return tempoRatio;
  }

  // Find the most compatible tracks for a given seed track
  findCompatibleTracks(seedTrack: TrackFeatures, candidateTracks: TrackFeatures[], limit: number = 10): Array<{ track: TrackFeatures; score: CompatibilityScore }> {
    const scoredTracks = candidateTracks.map(track => ({
      track,
      score: this.calculateCompatibility(seedTrack, track)
    }));

    // Sort by overall compatibility score (descending)
    scoredTracks.sort((a, b) => b.score.overall - a.score.overall);

    return scoredTracks.slice(0, limit);
  }
} 