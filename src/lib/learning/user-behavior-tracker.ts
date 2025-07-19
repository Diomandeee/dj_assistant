import { TrackFeatures, Track } from '@/types';

export interface UserAction {
  id: string;
  userId: string;
  action: 'like' | 'skip' | 'replay' | 'transition_used' | 'transition_rejected' | 'manual_override';
  trackId: string;
  targetTrackId?: string; // For transitions
  timestamp: Date;
  context: {
    playlistPosition?: number;
    transitionScore?: number;
    userMood?: string;
    sessionId: string;
  };
}

export interface UserPreferences {
  userId: string;
  preferredGenres: string[];
  tempoRange: { min: number; max: number };
  energyProfile: { morning: number; afternoon: number; evening: number; night: number };
  keyPreferences: string[];
  transitionStyle: 'smooth' | 'energetic' | 'creative' | 'minimal';
  averageSessionLength: number;
  skipThreshold: number; // Compatibility score below which user typically skips
  favoriteArtists: string[];
  lastUpdated: Date;
}

export interface LearningInsights {
  mostLikedFeatures: Partial<TrackFeatures>;
  commonTransitionPatterns: Array<{
    fromFeatures: Partial<TrackFeatures>;
    toFeatures: Partial<TrackFeatures>;
    successRate: number;
  }>;
  timeBasedPreferences: {
    hour: number;
    preferredTempo: number;
    preferredEnergy: number;
  }[];
  genreCompatibility: Record<string, Record<string, number>>;
  confidence: number;
}

interface PatternData {
  used: number;
  total: number;
  features: Record<string, unknown>;
}

export class UserBehaviorTracker {
  
  // Analyze user actions to extract learning insights
  async analyzeUserBehavior(userId: string, actions: UserAction[]): Promise<LearningInsights> {
    const likedTracks = await this.getLikedTracks(userId, actions);
    const transitionPatterns = this.analyzeTransitionPatterns(actions);
    const timePreferences = this.analyzeTimeBasedPreferences(actions);
    const genreCompatibility = this.analyzeGenreCompatibility();

    return {
      mostLikedFeatures: this.extractLikedFeatures(likedTracks),
      commonTransitionPatterns: transitionPatterns,
      timeBasedPreferences: timePreferences,
      genreCompatibility,
      confidence: this.calculateConfidence(actions.length)
    };
  }

  private async getLikedTracks(userId: string, actions: UserAction[]): Promise<Track[]> {
    // In a real implementation, this would query the database
    // For now, we'll simulate based on actions
    actions
      .filter(action => 
        action.action === 'like' || 
        action.action === 'replay' ||
        (action.action === 'transition_used' && (action.context.transitionScore ?? 0) > 0.8)
      )
      .map(action => action.trackId);

    // Return mock data for now
    return [];
  }

  private extractLikedFeatures(likedTracks: Track[]): Partial<TrackFeatures> {
    if (likedTracks.length === 0) return {};

    const features = likedTracks
      .map(track => track.features)
      .filter(features => features !== null);

    if (features.length === 0) return {};

    // Calculate averages for numeric features
    const avgTempo = this.calculateAverage(features.map(f => f?.tempo).filter(t => t !== null) as number[]);
    const avgEnergy = this.calculateAverage(features.map(f => f?.energyLevel).filter(e => e !== null) as number[]);
    const avgDanceability = this.calculateAverage(features.map(f => f?.danceability).filter(d => d !== null) as number[]);
    const avgValence = this.calculateAverage(features.map(f => f?.valence).filter(v => v !== null) as number[]);

    // Find most common key
    const keys = features.map(f => f?.musicalKey).filter(k => k !== null) as string[];
    const mostCommonKey = this.findMostCommon(keys);

    return {
      tempo: avgTempo,
      energyLevel: avgEnergy,
      danceability: avgDanceability,
      valence: avgValence,
      musicalKey: mostCommonKey
    };
  }

  private analyzeTransitionPatterns(actions: UserAction[]): Array<{
    fromFeatures: Partial<TrackFeatures>;
    toFeatures: Partial<TrackFeatures>;
    successRate: number;
  }> {
    const transitionActions = actions.filter(action => 
      action.action === 'transition_used' || action.action === 'transition_rejected'
    );

    if (transitionActions.length === 0) return [];

    // Group transitions by similarity
    const patterns: Map<string, PatternData> = new Map();

    transitionActions.forEach(action => {
      // Create a simple pattern key based on transition score and context
      const score = action.context.transitionScore ?? 0;
      const patternKey = score > 0.8 ? 'high_compatibility' : 
                        score > 0.5 ? 'medium_compatibility' : 'low_compatibility';

      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, { used: 0, total: 0, features: {} });
      }

      const pattern = patterns.get(patternKey)!;
      pattern.total++;
      if (action.action === 'transition_used') {
        pattern.used++;
      }
    });

    return Array.from(patterns.entries()).map(([, data]) => ({
      fromFeatures: { /* Would extract from actual track data */ },
      toFeatures: { /* Would extract from actual track data */ },
      successRate: data.used / data.total
    }));
  }

  private analyzeTimeBasedPreferences(actions: UserAction[]): Array<{
    hour: number;
    preferredTempo: number;
    preferredEnergy: number;
  }> {
    const hourlyData: Map<number, { tempos: number[]; energies: number[]; count: number }> = new Map();

    // Initialize hourly buckets
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.set(hour, { tempos: [], energies: [], count: 0 });
    }

    actions.forEach(action => {
      const hour = action.timestamp.getHours();
      const data = hourlyData.get(hour)!;
      data.count++;

      // In a real implementation, we'd get track features here
      // For now, we'll use some reasonable defaults based on time
      if (hour >= 6 && hour < 12) { // Morning
        data.tempos.push(120 + Math.random() * 20);
        data.energies.push(0.6 + Math.random() * 0.2);
      } else if (hour >= 12 && hour < 18) { // Afternoon
        data.tempos.push(125 + Math.random() * 25);
        data.energies.push(0.7 + Math.random() * 0.2);
      } else if (hour >= 18 && hour < 22) { // Evening
        data.tempos.push(130 + Math.random() * 30);
        data.energies.push(0.8 + Math.random() * 0.1);
      } else { // Night
        data.tempos.push(115 + Math.random() * 15);
        data.energies.push(0.5 + Math.random() * 0.3);
      }
    });

    return Array.from(hourlyData.entries())
      .filter(([, data]) => data.count > 0)
      .map(([hour, data]) => ({
        hour,
        preferredTempo: this.calculateAverage(data.tempos),
        preferredEnergy: this.calculateAverage(data.energies)
      }));
  }

  private analyzeGenreCompatibility(): Record<string, Record<string, number>> {
    // Simulate genre compatibility analysis
    const genreMatrix: Record<string, Record<string, number>> = {
      'Electronic': { 'Electronic': 0.9, 'House': 0.8, 'Techno': 0.75, 'Hip-Hop': 0.6 },
      'House': { 'House': 0.95, 'Electronic': 0.8, 'Disco': 0.7, 'Funk': 0.65 },
      'Hip-Hop': { 'Hip-Hop': 0.9, 'R&B': 0.8, 'Trap': 0.85, 'Electronic': 0.6 },
      'Rock': { 'Rock': 0.9, 'Alternative': 0.8, 'Indie': 0.7, 'Pop': 0.6 },
    };

    return genreMatrix;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private findMostCommon<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    
    const frequency: Map<T, number> = new Map();
    array.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let mostCommon = array[0];
    let maxCount = 0;
    frequency.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    });

    return mostCommon;
  }

  private calculateConfidence(actionCount: number): number {
    // Confidence increases with more data points
    if (actionCount < 10) return 0.3;
    if (actionCount < 50) return 0.5;
    if (actionCount < 100) return 0.7;
    if (actionCount < 500) return 0.8;
    return 0.9;
  }

  // Update user preferences based on recent actions
  updateUserPreferences(
    currentPreferences: UserPreferences,
    recentActions: UserAction[],
    insights: LearningInsights
  ): UserPreferences {
    const updated = { ...currentPreferences };

    // Update tempo range based on liked tracks
    if (insights.mostLikedFeatures.tempo) {
      const likedTempo = insights.mostLikedFeatures.tempo;
      updated.tempoRange = {
        min: Math.max(80, likedTempo - 20),
        max: Math.min(180, likedTempo + 20)
      };
    }

    // Update energy profile based on time preferences
    insights.timeBasedPreferences.forEach(pref => {
      if (pref.hour >= 6 && pref.hour < 12) {
        updated.energyProfile.morning = (updated.energyProfile.morning + pref.preferredEnergy) / 2;
      } else if (pref.hour >= 12 && pref.hour < 18) {
        updated.energyProfile.afternoon = (updated.energyProfile.afternoon + pref.preferredEnergy) / 2;
      } else if (pref.hour >= 18 && pref.hour < 22) {
        updated.energyProfile.evening = (updated.energyProfile.evening + pref.preferredEnergy) / 2;
      } else {
        updated.energyProfile.night = (updated.energyProfile.night + pref.preferredEnergy) / 2;
      }
    });

    // Update skip threshold based on user behavior
    const skippedActions = recentActions.filter(a => a.action === 'skip');
    if (skippedActions.length > 0) {
      const avgSkipScore = skippedActions
        .map(a => a.context.transitionScore || 0.5)
        .reduce((sum, score) => sum + score, 0) / skippedActions.length;
      
      updated.skipThreshold = (updated.skipThreshold + avgSkipScore) / 2;
    }

    // Determine transition style preference
    const transitionSuccess = insights.commonTransitionPatterns
      .reduce((sum, pattern) => sum + pattern.successRate, 0) / 
      (insights.commonTransitionPatterns.length || 1);

    if (transitionSuccess > 0.8) {
      updated.transitionStyle = 'smooth';
    } else if (transitionSuccess > 0.6) {
      updated.transitionStyle = 'energetic';
    } else {
      updated.transitionStyle = 'creative';
    }

    updated.lastUpdated = new Date();
    return updated;
  }

  // Generate personalized track scoring adjustments
  generatePersonalizedWeights(preferences: UserPreferences, currentHour: number): {
    tempoWeight: number;
    energyWeight: number;
    keyWeight: number;
    genreWeight: number;
    timeBonus: number;
  } {
    const timeOfDay = this.getTimeOfDay(currentHour);
    const targetEnergy = preferences.energyProfile[timeOfDay];

    return {
      tempoWeight: 0.3, // Base weight
      energyWeight: 0.4 + (targetEnergy > 0.7 ? 0.1 : 0), // Higher weight for energetic times
      keyWeight: preferences.transitionStyle === 'smooth' ? 0.3 : 0.2,
      genreWeight: 0.2,
      timeBonus: this.calculateTimeBonus(currentHour, preferences)
    };
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private calculateTimeBonus(currentHour: number, preferences: UserPreferences): number {
    const timeOfDay = this.getTimeOfDay(currentHour);
    const targetEnergy = preferences.energyProfile[timeOfDay];
    
    // Higher bonus for tracks that match the time-based energy preference
    return targetEnergy > 0.7 ? 0.1 : 0.05;
  }
} 