import { TrackFeatures, TransitionPoint } from '@/types';

export interface TransitionAnalysis {
  optimalPoints: TransitionPoint[];
  energyMatchScore: number;
  beatAlignmentScore: number;
  keyCompatibilityScore: number;
  recommendedLength: number;
  transitionType: 'beatmatch' | 'echo_out' | 'filter_fade' | 'quick_cut';
  confidence: number;
}

export class TransitionOptimizer {
  
  analyzeTransition(fromTrack: TrackFeatures, toTrack: TrackFeatures): TransitionAnalysis {
    const beatAlignment = this.analyzeBeatAlignment(fromTrack, toTrack);
    const energyMatch = this.analyzeEnergyMatch(fromTrack, toTrack);
    const keyCompatibility = this.analyzeKeyCompatibility(fromTrack, toTrack);
    const phrasePoints = this.detectPhraseTransitions(fromTrack, toTrack);
    const structuralPoints = this.findStructuralTransitions(fromTrack, toTrack);
    
    // Combine all analysis to find optimal transition points
    const optimalPoints = this.combineTransitionPoints(
      beatAlignment.points,
      phrasePoints,
      structuralPoints
    );

    // Determine best transition type based on compatibility
    const transitionType = this.determineTransitionType(
      beatAlignment.score,
      energyMatch.score,
      keyCompatibility
    );

    // Calculate recommended transition length
    const recommendedLength = this.calculateTransitionLength(
      beatAlignment.score,
      energyMatch.score,
      fromTrack.tempo ?? 120
    );

    return {
      optimalPoints: optimalPoints.slice(0, 5), // Top 5 suggestions
      energyMatchScore: energyMatch.score,
      beatAlignmentScore: beatAlignment.score,
      keyCompatibilityScore: keyCompatibility,
      recommendedLength,
      transitionType,
      confidence: this.calculateOverallConfidence(beatAlignment.score, energyMatch.score, keyCompatibility)
    };
  }

  private analyzeBeatAlignment(fromTrack: TrackFeatures, toTrack: TrackFeatures): {
    score: number;
    points: Array<{ fromTime: number; toTime: number; strength: number }>;
  } {
    const fromBPM = fromTrack.tempo ?? 120;
    const toBPM = toTrack.tempo ?? 120;
    const fromBeats = fromTrack.beatPositions ?? [];
    const toBeats = toTrack.beatPositions ?? [];

    // Calculate BPM compatibility
    const bpmDifference = Math.abs(fromBPM - toBPM);
    const bpmScore = Math.max(0, 1 - (bpmDifference / 20)); // Normalize to 0-1

    // Find beat alignment points
    const alignmentPoints: Array<{ fromTime: number; toTime: number; strength: number }> = [];
    
    if (fromBeats.length > 0 && toBeats.length > 0) {
      // Look for strong beat alignments (every 4th beat)
      const fromStrongBeats = fromBeats.filter((_, index) => index % 4 === 0);
      const toStrongBeats = toBeats.filter((_, index) => index % 4 === 0);

      fromStrongBeats.forEach(fromBeat => {
        toStrongBeats.forEach(toBeat => {
          if (toBeat < 30) { // Only consider first 30 seconds of incoming track
            const strength = this.calculateBeatStrength(fromBeat, toBeat, fromBPM, toBPM);
            if (strength > 0.6) { // Only include strong alignments
              alignmentPoints.push({
                fromTime: fromBeat,
                toTime: toBeat,
                strength
              });
            }
          }
        });
      });
    }

    return {
      score: bpmScore,
      points: alignmentPoints.sort((a, b) => b.strength - a.strength).slice(0, 10)
    };
  }

  private calculateBeatStrength(fromBeat: number, toBeat: number, fromBPM: number, toBPM: number): number {
    // Calculate how well beats would align during transition
    const bpmRatio = Math.min(fromBPM, toBPM) / Math.max(fromBPM, toBPM);
    const phaseAlignment = Math.cos(2 * Math.PI * (fromBeat - toBeat) / 4); // 4-beat phrase
    return bpmRatio * Math.abs(phaseAlignment);
  }

  private analyzeEnergyMatch(fromTrack: TrackFeatures, toTrack: TrackFeatures): {
    score: number;
    energyProfile: Array<{ time: number; energy: number }>;
  } {
    const fromEnergy = fromTrack.energyLevel ?? 0.5;
    const toEnergy = toTrack.energyLevel ?? 0.5;
    
    // Calculate energy compatibility
    const energyDifference = Math.abs(fromEnergy - toEnergy);
    const energyScore = Math.max(0, 1 - energyDifference * 2);

    // Create simple energy profile (would be more sophisticated with real-time analysis)
    const energyProfile = [
      { time: 0, energy: toEnergy * 0.3 }, // Intro
      { time: 10, energy: toEnergy * 0.6 }, // Build
      { time: 20, energy: toEnergy }, // Full energy
    ];

    return {
      score: energyScore,
      energyProfile
    };
  }

  private analyzeKeyCompatibility(fromTrack: TrackFeatures, toTrack: TrackFeatures): number {
    const fromKey = fromTrack.musicalKey ?? 'C';
    const toKey = toTrack.musicalKey ?? 'C';

    // Circle of fifths compatibility (reuse from comparison.ts logic)
    const circleOfFifths: Record<string, number> = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
      'F#': 6, 'C#': 7, 'G#': 8, 'D#': 9, 'A#': 10, 'F': 11,
      'Cm': 12, 'Gm': 13, 'Dm': 14, 'Am': 15, 'Em': 16, 'Bm': 17,
      'F#m': 18, 'C#m': 19, 'G#m': 20, 'D#m': 21, 'A#m': 22, 'Fm': 23
    };

    const pos1 = circleOfFifths[fromKey] ?? 0;
    const pos2 = circleOfFifths[toKey] ?? 0;
    
    const distance = Math.min(
      Math.abs(pos1 - pos2),
      Math.abs(pos1 - pos2 + 12),
      Math.abs(pos1 - pos2 - 12)
    );

    if (distance === 0) return 1.0;
    if (distance <= 1) return 0.8;
    if (distance <= 2) return 0.6;
    if (distance <= 3) return 0.4;
    return 0.2;
  }

  private detectPhraseTransitions(fromTrack: TrackFeatures, toTrack: TrackFeatures): TransitionPoint[] {
    const fromBeats = fromTrack.beatPositions ?? [];
    const toBeats = toTrack.beatPositions ?? [];
    const phrasePoints: TransitionPoint[] = [];

    // Detect 8, 16, 32 beat phrases
    const phraseLengths = [8, 16, 32];
    
    phraseLengths.forEach(phraseLength => {
      // Find phrase boundaries in outgoing track
      for (let i = phraseLength; i < fromBeats.length; i += phraseLength) {
        const fromTime = fromBeats[i];
        
        // Find matching phrase start in incoming track
        for (let j = 0; j < Math.min(toBeats.length, phraseLength * 2); j += phraseLength) {
          const toTime = toBeats[j];
          
          if (toTime < 30) { // Within first 30 seconds
            phrasePoints.push({
              fromTrackTime: fromTime,
              toTrackTime: toTime,
              score: 0.8, // High score for phrase alignment
              type: 'beatmatch',
              length: this.calculateOptimalLength(fromTime),
              confidence: 0.8
            });
          }
        }
      }
    });

    return phrasePoints.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private findStructuralTransitions(fromTrack: TrackFeatures, toTrack: TrackFeatures): TransitionPoint[] {
    const fromStructure = fromTrack.structureSegments ?? [];
    const toStructure = toTrack.structureSegments ?? [];
    const structuralPoints: TransitionPoint[] = [];

    // Find optimal structural transition points
    const preferredTransitions = [
      { from: 'chorus', to: 'intro', score: 1.0 },
      { from: 'outro', to: 'intro', score: 0.9 },
      { from: 'verse', to: 'verse', score: 0.8 },
      { from: 'chorus', to: 'verse', score: 0.7 },
      { from: 'bridge', to: 'intro', score: 0.8 }
    ];

    fromStructure.forEach(fromSegment => {
      toStructure.forEach(toSegment => {
        // Only consider transitions within reasonable time ranges
        if (toSegment.start < 60) { // First minute of incoming track
          const transition = preferredTransitions.find(
            t => t.from === fromSegment.type && t.to === toSegment.type
          );
          
          if (transition) {
            structuralPoints.push({
              fromTrackTime: fromSegment.end - 8, // 8 seconds before segment end
              toTrackTime: toSegment.start,
              score: transition.score * fromSegment.confidence * toSegment.confidence,
              type: this.getTransitionTypeForStructure(fromSegment.type, toSegment.type),
              length: 16, // Default 16-second transition
              confidence: fromSegment.confidence * toSegment.confidence
            });
          }
        }
      });
    });

    return structuralPoints.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private getTransitionTypeForStructure(fromType: string, toType: string): TransitionPoint['type'] {
    if (fromType === 'outro' && toType === 'intro') return 'echo_out';
    if (fromType === 'chorus' && toType === 'intro') return 'filter_fade';
    if (fromType === 'verse' && toType === 'verse') return 'beatmatch';
    return 'beatmatch';
  }

  private combineTransitionPoints(
    beatPoints: Array<{ fromTime: number; toTime: number; strength: number }>,
    phrasePoints: TransitionPoint[],
    structuralPoints: TransitionPoint[]
  ): TransitionPoint[] {
    const allPoints: TransitionPoint[] = [];

    // Convert beat alignment points
    beatPoints.forEach(point => {
      allPoints.push({
        fromTrackTime: point.fromTime,
        toTrackTime: point.toTime,
        score: point.strength,
        type: 'beatmatch',
        length: this.calculateOptimalLength(point.fromTime),
        confidence: point.strength
      });
    });

    // Add phrase and structural points
    allPoints.push(...phrasePoints, ...structuralPoints);

    // Remove duplicates and sort by score
    const uniquePoints = this.removeDuplicatePoints(allPoints);
    return uniquePoints.sort((a, b) => b.score - a.score);
  }

  private removeDuplicatePoints(points: TransitionPoint[]): TransitionPoint[] {
    const unique: TransitionPoint[] = [];
    const tolerance = 2; // 2-second tolerance for duplicates

    points.forEach(point => {
      const isDuplicate = unique.some(existing => 
        Math.abs(existing.fromTrackTime - point.fromTrackTime) < tolerance &&
        Math.abs(existing.toTrackTime - point.toTrackTime) < tolerance
      );

      if (!isDuplicate) {
        unique.push(point);
      }
    });

    return unique;
  }

  private calculateOptimalLength(fromTime: number): number {
    // Base transition length on timing and context
    const baseLength = 8; // 8 seconds default
    const timeBasedAdjustment = Math.min(4, fromTime / 30); // Longer for later transitions
    return Math.round(baseLength + timeBasedAdjustment);
  }

  private determineTransitionType(
    beatScore: number,
    energyScore: number,
    keyScore: number
  ): TransitionPoint['type'] {
    const overallScore = (beatScore + energyScore + keyScore) / 3;

    if (overallScore > 0.8) return 'beatmatch'; // High compatibility
    if (energyScore < 0.3) return 'echo_out'; // Low energy match
    if (keyScore < 0.4) return 'filter_fade'; // Poor key match
    return 'beatmatch'; // Default
  }

  private calculateTransitionLength(beatScore: number, energyScore: number, bpm: number): number {
    const baseLength = 60 / bpm * 16; // 16 beats
    const compatibilityMultiplier = (beatScore + energyScore) / 2;
    return Math.round(baseLength * (0.5 + compatibilityMultiplier)); // 8-16 seconds typically
  }

  private calculateOverallConfidence(beatScore: number, energyScore: number, keyScore: number): number {
    return (beatScore * 0.4 + energyScore * 0.3 + keyScore * 0.3);
  }

  // Generate detailed mixing instructions for DJs
  generateMixingInstructions(analysis: TransitionAnalysis, fromTrack: TrackFeatures, toTrack: TrackFeatures): string[] {
    const instructions: string[] = [];
    const bestPoint = analysis.optimalPoints[0];

    if (!bestPoint) {
      return ['No optimal transition points found. Consider manual mixing.'];
    }

    // Format time helpers
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Basic cue point instruction
    instructions.push(`🎯 **Optimal Cue Point**: ${formatTime(bestPoint.fromTrackTime)} → ${formatTime(bestPoint.toTrackTime)}`);
    
    // Transition type specific instructions
    switch (bestPoint.type) {
      case 'beatmatch':
        instructions.push('🎵 **Beatmatch Transition**: Match tempos and align beats for seamless mix');
        instructions.push(`⏱️ **Transition Length**: ${analysis.recommendedLength} seconds`);
        break;
      case 'echo_out':
        instructions.push('🔄 **Echo Out**: Apply echo/delay to outgoing track while bringing in new track');
        break;
      case 'filter_fade':
        instructions.push('🎛️ **Filter Fade**: Use low-pass filter on outgoing track while fading in new track');
        break;
      case 'quick_cut':
        instructions.push('✂️ **Quick Cut**: Sharp transition at musical phrase boundary');
        break;
    }

    // Key compatibility advice
    if (analysis.keyCompatibilityScore > 0.7) {
      instructions.push('🎼 **Key Match**: Excellent harmonic compatibility');
    } else if (analysis.keyCompatibilityScore < 0.4) {
      instructions.push('⚠️ **Key Clash**: Consider using filter or echo to mask harmonic differences');
    }

    // BPM advice
    const fromBPM = fromTrack.tempo ?? 120;
    const toBPM = toTrack.tempo ?? 120;
    if (Math.abs(fromBPM - toBPM) > 5) {
      instructions.push(`📊 **BPM**: Gradually adjust from ${Math.round(fromBPM)} to ${Math.round(toBPM)} BPM`);
    }

    // Energy flow advice
    if (analysis.energyMatchScore > 0.8) {
      instructions.push('⚡ **Energy**: Perfect energy flow - maintain current intensity');
    } else if (analysis.energyMatchScore < 0.3) {
      instructions.push('📈 **Energy**: Significant energy change - use buildup or breakdown technique');
    }

    // Confidence indicator
    const confidenceLevel = analysis.confidence > 0.8 ? 'High' : analysis.confidence > 0.5 ? 'Medium' : 'Low';
    instructions.push(`📊 **Confidence**: ${confidenceLevel} (${Math.round(analysis.confidence * 100)}%)`);

    return instructions;
  }
} 