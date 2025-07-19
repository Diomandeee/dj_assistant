'use client';

import { useState } from 'react';
import { Track } from '@/types';

interface TransitionAnalysisData {
  fromTrack: {
    id: string;
    title: string;
    artist: string;
    tempo: number;
    key: string;
  };
  toTrack: {
    id: string;
    title: string;
    artist: string;
    tempo: number;
    key: string;
  };
  analysis: {
    optimalPoints: Array<{
      fromTrackTime: number;
      toTrackTime: number;
      score: number;
      type: string;
      length: number;
      confidence: number;
    }>;
    energyMatchScore: number;
    beatAlignmentScore: number;
    keyCompatibilityScore: number;
    recommendedLength: number;
    transitionType: string;
    confidence: number;
  };
  instructions: string[];
}

interface TransitionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromTrack: Track | null;
  toTrack: Track | null;
}

export function TransitionAnalysisModal({ isOpen, onClose, fromTrack, toTrack }: TransitionAnalysisModalProps) {
  const [analysisData, setAnalysisData] = useState<TransitionAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTransition = async () => {
    if (!fromTrack || !toTrack) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transitions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTrackId: fromTrack.id,
          toTrackId: toTrack.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze transition');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTransitionTypeIcon = (type: string) => {
    switch (type) {
      case 'beatmatch': return '🎵';
      case 'echo_out': return '🔄';
      case 'filter_fade': return '🎛️';
      case 'quick_cut': return '✂️';
      default: return '🎶';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transition Analysis</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Track Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">From Track</h3>
              <p className="font-medium">{fromTrack?.title || fromTrack?.filename}</p>
              {fromTrack?.artist && <p className="text-sm text-gray-600">{fromTrack.artist}</p>}
              <div className="flex space-x-4 mt-2 text-sm">
                {fromTrack?.features?.tempo && (
                  <span>{Math.round(fromTrack.features.tempo)} BPM</span>
                )}
                {fromTrack?.features?.musicalKey && (
                  <span>Key: {fromTrack.features.musicalKey}</span>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">To Track</h3>
              <p className="font-medium">{toTrack?.title || toTrack?.filename}</p>
              {toTrack?.artist && <p className="text-sm text-gray-600">{toTrack.artist}</p>}
              <div className="flex space-x-4 mt-2 text-sm">
                {toTrack?.features?.tempo && (
                  <span>{Math.round(toTrack.features.tempo)} BPM</span>
                )}
                {toTrack?.features?.musicalKey && (
                  <span>Key: {toTrack.features.musicalKey}</span>
                )}
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          {!analysisData && !isLoading && (
            <div className="text-center mb-6">
              <button
                onClick={analyzeTransition}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Analyze Transition
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing optimal transition points...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisData && (
            <div className="space-y-6">
              {/* Overall Scores */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Compatibility Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`rounded-full p-2 mb-2 ${getScoreColor(analysisData.analysis.beatAlignmentScore)}`}>
                      <span className="text-sm font-medium">Beat</span>
                    </div>
                    <p className="text-xs">{Math.round(analysisData.analysis.beatAlignmentScore * 100)}%</p>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-2 mb-2 ${getScoreColor(analysisData.analysis.keyCompatibilityScore)}`}>
                      <span className="text-sm font-medium">Key</span>
                    </div>
                    <p className="text-xs">{Math.round(analysisData.analysis.keyCompatibilityScore * 100)}%</p>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-2 mb-2 ${getScoreColor(analysisData.analysis.energyMatchScore)}`}>
                      <span className="text-sm font-medium">Energy</span>
                    </div>
                    <p className="text-xs">{Math.round(analysisData.analysis.energyMatchScore * 100)}%</p>
                  </div>
                  <div className="text-center">
                    <div className={`rounded-full p-2 mb-2 ${getScoreColor(analysisData.analysis.confidence)}`}>
                      <span className="text-sm font-medium">Overall</span>
                    </div>
                    <p className="text-xs">{Math.round(analysisData.analysis.confidence * 100)}%</p>
                  </div>
                </div>
              </div>

              {/* Optimal Transition Points */}
              <div>
                <h3 className="font-semibold mb-3">Optimal Transition Points</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysisData.analysis.optimalPoints.map((point, index) => (
                    <div key={index} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTransitionTypeIcon(point.type)}</span>
                        <div>
                          <p className="font-medium">
                            {formatTime(point.fromTrackTime)} → {formatTime(point.toTrackTime)}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {point.type.replace('_', ' ')} • {point.length}s
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs ${getScoreColor(point.score)}`}>
                          {Math.round(point.score * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mixing Instructions */}
              <div>
                <h3 className="font-semibold mb-3">Mixing Instructions</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {analysisData.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <p className="text-sm" dangerouslySetInnerHTML={{ 
                        __html: instruction.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Transition */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Recommended Transition</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getTransitionTypeIcon(analysisData.analysis.transitionType)}</span>
                  <div>
                    <p className="font-medium capitalize">
                      {analysisData.analysis.transitionType.replace('_', ' ')} Transition
                    </p>
                    <p className="text-sm text-gray-600">
                      {analysisData.analysis.recommendedLength} seconds • {Math.round(analysisData.analysis.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 