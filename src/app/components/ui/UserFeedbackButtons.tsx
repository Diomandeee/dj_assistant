'use client';

import { useState } from 'react';
import { Track } from '@/types';

interface UserFeedbackButtonsProps {
  track: Track;
  userId?: string;
  playlistPosition?: number;
  sessionId?: string;
  onFeedback?: (action: string) => void;
}

export function UserFeedbackButtons({ 
  track, 
  userId = 'demo-user', 
  playlistPosition, 
  sessionId = 'session-' + Date.now(),
  onFeedback 
}: UserFeedbackButtonsProps) {
  const [userActions, setUserActions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'like' | 'skip' | 'replay') => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      // Track user action for learning
      const response = await fetch('/api/user/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          trackId: track.id,
          context: {
            playlistPosition,
            sessionId,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUserActions(prev => ({ ...prev, [action]: true }));
        
        // Call callback if provided
        onFeedback?.(action);

        // Show learning insight if available
        if (result.insights?.updatedPreferences) {
          console.log('🎯 Learning from your feedback:', result.insights);
        }
      } else {
        console.error('Failed to track user action');
      }
    } catch (error) {
      console.error('Error tracking user action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Like Button */}
      <button
        onClick={() => handleAction('like')}
        disabled={isLoading}
        className={`
          flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all
          ${userActions.like
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-300'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="text-sm">
          {userActions.like ? '❤️' : '🤍'}
        </span>
        <span>Like</span>
      </button>

      {/* Skip Button */}
      <button
        onClick={() => handleAction('skip')}
        disabled={isLoading}
        className={`
          flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all
          ${userActions.skip
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-300'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="text-sm">⏭️</span>
        <span>Skip</span>
      </button>

      {/* Replay Button */}
      <button
        onClick={() => handleAction('replay')}
        disabled={isLoading}
        className={`
          flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all
          ${userActions.replay
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-300'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className="text-sm">🔄</span>
        <span>Replay</span>
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
          <span>Learning...</span>
        </div>
      )}
    </div>
  );
}

// Learning Insights Display Component
interface LearningInsightsProps {
  userId: string;
}

interface UserInsights {
  preferences?: {
    tempoRange: { min: number; max: number };
    transitionStyle: string;
    energyProfile: { morning: number; afternoon: number; evening: number; night: number };
    lastUpdated: string;
  };
  recentActions?: number;
  insights?: {
    confidence?: number;
    message?: string;
    timeBasedPreferences?: Array<{ hour: number; preferredTempo: number; preferredEnergy: number }>;
    personalizedWeights?: Record<string, number>;
    mostLikedFeatures?: Record<string, unknown>;
  };
}

export function LearningInsights({ userId }: LearningInsightsProps) {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/actions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!insights && !isLoading) {
    return (
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🎯 AI Learning</h3>
        <p className="text-sm text-blue-700 mb-3">
          Like and skip tracks to help me learn your preferences!
        </p>
        <button
          onClick={fetchInsights}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
        >
          View My Profile
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!insights?.preferences) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">🌱 Getting Started</h3>
        <p className="text-sm text-yellow-700">
          {insights?.insights?.message || 'Start interacting with tracks to build your profile!'}
        </p>
      </div>
    );
  }

  const confidence = insights.insights?.confidence || 0;
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.7) return 'text-green-600 bg-green-100';
    if (conf >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">🎯 Your Music Profile</h3>
        <div className={`px-2 py-1 rounded text-xs ${getConfidenceColor(confidence)}`}>
          {Math.round(confidence * 100)}% confidence
        </div>
      </div>

      {/* Preferences Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white rounded p-2">
          <div className="font-medium text-gray-700">Tempo Range</div>
          <div className="text-gray-600">
            {insights.preferences.tempoRange.min}-{insights.preferences.tempoRange.max} BPM
          </div>
        </div>
        <div className="bg-white rounded p-2">
          <div className="font-medium text-gray-700">Transition Style</div>
          <div className="text-gray-600 capitalize">
            {insights.preferences.transitionStyle}
          </div>
        </div>
      </div>

      {/* Time-based Preferences */}
      {insights.insights?.timeBasedPreferences?.length && insights.insights.timeBasedPreferences.length > 0 && (
        <div className="bg-white rounded p-2">
          <div className="font-medium text-gray-700 text-xs mb-1">Energy by Time</div>
          <div className="flex space-x-2">
            {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
              <div key={time} className="text-center">
                <div className="text-xs text-gray-500">{time}</div>
                <div className="text-xs font-medium">
                  {Math.round((insights.preferences!.energyProfile[time.toLowerCase() as keyof typeof insights.preferences.energyProfile] || 0.5) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Actions tracked: {insights.recentActions || 0} • 
        Updated: {new Date(insights.preferences.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
} 