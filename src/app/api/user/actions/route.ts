import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';
import { UserBehaviorTracker, UserAction } from '@/lib/learning/user-behavior-tracker';

// Type for database action context
interface DbActionContext {
  sessionId?: string;
  playlistPosition?: number;
  transitionScore?: number;
  userMood?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, trackId, targetTrackId, context } = body;

    if (!userId || !action || !trackId) {
      return NextResponse.json(
        { error: 'userId, action, and trackId are required' }, 
        { status: 400 }
      );
    }

    // Store the user action in database
    const userAction = await prisma.userAction.create({
      data: {
        userId,
        action,
        trackId,
        targetTrackId,
        context: context || {},
        timestamp: new Date()
      }
    });

    // Get recent actions for learning (last 100 actions)
    const recentActions = await prisma.userAction.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Convert to our UserAction format
    const formattedActions: UserAction[] = recentActions.map(dbAction => {
      const actionContext = dbAction.context as DbActionContext;
      return {
        id: dbAction.id,
        userId: dbAction.userId,
        action: dbAction.action as UserAction['action'],
        trackId: dbAction.trackId,
        targetTrackId: dbAction.targetTrackId || undefined,
        timestamp: dbAction.timestamp,
        context: {
          sessionId: actionContext?.sessionId || 'unknown',
          playlistPosition: actionContext?.playlistPosition,
          transitionScore: actionContext?.transitionScore,
          userMood: actionContext?.userMood
        }
      };
    });

    // Analyze user behavior and update preferences if we have enough data
    if (recentActions.length >= 10) {
      const tracker = new UserBehaviorTracker();
      const insights = await tracker.analyzeUserBehavior(userId, formattedActions);

      // Get or create user preferences
      let userPreferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      if (!userPreferences) {
        // Create default preferences
        userPreferences = await prisma.userPreferences.create({
          data: {
            userId,
            preferredGenres: [],
            tempoRange: { min: 100, max: 140 },
            energyProfile: { morning: 0.6, afternoon: 0.7, evening: 0.8, night: 0.5 },
            keyPreferences: [],
            transitionStyle: 'smooth',
            averageSessionLength: 30,
            skipThreshold: 0.4,
            favoriteArtists: []
          }
        });
      }

      // Update preferences based on insights
      const currentPrefs = {
        userId: userPreferences.userId,
        preferredGenres: userPreferences.preferredGenres as string[],
        tempoRange: userPreferences.tempoRange as { min: number; max: number },
        energyProfile: userPreferences.energyProfile as { morning: number; afternoon: number; evening: number; night: number },
        keyPreferences: userPreferences.keyPreferences as string[],
        transitionStyle: userPreferences.transitionStyle as 'smooth' | 'energetic' | 'creative' | 'minimal',
        averageSessionLength: userPreferences.averageSessionLength,
        skipThreshold: userPreferences.skipThreshold,
        favoriteArtists: userPreferences.favoriteArtists as string[],
        lastUpdated: userPreferences.lastUpdated
      };

      const updatedPrefs = tracker.updateUserPreferences(currentPrefs, formattedActions, insights);

      // Save updated preferences
      await prisma.userPreferences.update({
        where: { userId },
        data: {
          preferredGenres: updatedPrefs.preferredGenres,
          tempoRange: updatedPrefs.tempoRange,
          energyProfile: updatedPrefs.energyProfile,
          keyPreferences: updatedPrefs.keyPreferences,
          transitionStyle: updatedPrefs.transitionStyle,
          averageSessionLength: updatedPrefs.averageSessionLength,
          skipThreshold: updatedPrefs.skipThreshold,
          favoriteArtists: updatedPrefs.favoriteArtists,
          lastUpdated: new Date()
        }
      });

      return NextResponse.json({
        action: userAction,
        insights: {
          confidence: insights.confidence,
          trackingActions: recentActions.length,
          updatedPreferences: true,
          timeOfDay: tracker.generatePersonalizedWeights(updatedPrefs, new Date().getHours())
        }
      });
    }

    return NextResponse.json({
      action: userAction,
      insights: {
        confidence: 0.1,
        trackingActions: recentActions.length,
        updatedPreferences: false,
        message: 'Need more actions for learning (minimum 10)'
      }
    });

  } catch (error) {
    console.error('User action tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track user action' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }

    // Get user preferences and recent actions
    const [preferences, recentActions] = await Promise.all([
      prisma.userPreferences.findUnique({
        where: { userId }
      }),
      prisma.userAction.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 50
      })
    ]);

    if (!preferences) {
      return NextResponse.json({
        preferences: null,
        recentActions: recentActions.length,
        insights: {
          confidence: 0,
          message: 'No preferences found. Start interacting to build your profile!'
        }
      });
    }

    // Generate insights
    const tracker = new UserBehaviorTracker();
    const formattedActions: UserAction[] = recentActions.map(dbAction => {
      const actionContext = dbAction.context as DbActionContext;
      return {
        id: dbAction.id,
        userId: dbAction.userId,
        action: dbAction.action as UserAction['action'],
        trackId: dbAction.trackId,
        targetTrackId: dbAction.targetTrackId || undefined,
        timestamp: dbAction.timestamp,
        context: {
          sessionId: actionContext?.sessionId || 'unknown',
          playlistPosition: actionContext?.playlistPosition,
          transitionScore: actionContext?.transitionScore,
          userMood: actionContext?.userMood
        }
      };
    });

    const insights = await tracker.analyzeUserBehavior(userId, formattedActions);
    const personalizedWeights = tracker.generatePersonalizedWeights({
      userId: preferences.userId,
      preferredGenres: preferences.preferredGenres as string[],
      tempoRange: preferences.tempoRange as { min: number; max: number },
      energyProfile: preferences.energyProfile as { morning: number; afternoon: number; evening: number; night: number },
      keyPreferences: preferences.keyPreferences as string[],
      transitionStyle: preferences.transitionStyle as 'smooth' | 'energetic' | 'creative' | 'minimal',
      averageSessionLength: preferences.averageSessionLength,
      skipThreshold: preferences.skipThreshold,
      favoriteArtists: preferences.favoriteArtists as string[],
      lastUpdated: preferences.lastUpdated
    }, new Date().getHours());

    return NextResponse.json({
      preferences: {
        ...preferences,
        preferredGenres: preferences.preferredGenres as string[],
        tempoRange: preferences.tempoRange as { min: number; max: number },
        energyProfile: preferences.energyProfile as { morning: number; afternoon: number; evening: number; night: number },
        keyPreferences: preferences.keyPreferences as string[],
        favoriteArtists: preferences.favoriteArtists as string[]
      },
      recentActions: recentActions.length,
      insights: {
        confidence: insights.confidence,
        personalizedWeights,
        timeBasedPreferences: insights.timeBasedPreferences,
        mostLikedFeatures: insights.mostLikedFeatures
      }
    });

  } catch (error) {
    console.error('Get user preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get user preferences' }, 
      { status: 500 }
    );
  }
} 