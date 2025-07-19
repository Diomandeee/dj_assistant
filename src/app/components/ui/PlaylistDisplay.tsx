'use client';

import { useState } from 'react';
import { Track, CompatibilityScore } from '@/types';
import { TransitionAnalysisModal } from './TransitionAnalysisModal';
import { UserFeedbackButtons } from './UserFeedbackButtons';

interface PlaylistItem {
  track: Track;
  position: number;
  compatibilityScore?: CompatibilityScore;
}

interface PlaylistDisplayProps {
  tracks: PlaylistItem[];
  isLoading?: boolean;
  onTrackSelect?: (track: Track) => void;
  userId?: string;
  sessionId?: string;
}

export function PlaylistDisplay({ tracks, isLoading, onTrackSelect, userId, sessionId }: PlaylistDisplayProps) {
  const [selectedTransition, setSelectedTransition] = useState<{ from: Track; to: Track } | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const openTransitionAnalysis = (fromTrack: Track, toTrack: Track) => {
    setSelectedTransition({ from: fromTrack, to: toTrack });
    setIsAnalysisModalOpen(true);
  };

  const closeTransitionAnalysis = () => {
    setIsAnalysisModalOpen(false);
    setSelectedTransition(null);
  };

  const handleFeedback = (trackId: string, action: string) => {
    console.log(`Track ${trackId} received ${action} feedback`);
    // Could trigger playlist regeneration or other actions here
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg p-4 h-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No playlist generated yet</p>
        <p className="text-gray-400 text-xs mt-1">Upload tracks and select a seed track to generate a playlist</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tracks.map((item, index) => (
          <div key={item.track.id}>
            {/* Track Item */}
            <div
              className={`
                p-4 rounded-lg border transition-all duration-200 cursor-pointer
                ${index === 0 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
              onClick={() => onTrackSelect?.(item.track)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Position indicator */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index === 0 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {index === 0 ? '🎵' : index}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.track.title || item.track.filename}
                      </h3>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Seed
                        </span>
                      )}
                    </div>
                    {item.track.artist && (
                      <p className="text-sm text-gray-500 truncate">{item.track.artist}</p>
                    )}
                    
                    {/* Track features */}
                    {item.track.features && (
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        {item.track.features.tempo && (
                          <span>{Math.round(item.track.features.tempo)} BPM</span>
                        )}
                        {item.track.features.musicalKey && (
                          <span>Key: {item.track.features.musicalKey}</span>
                        )}
                        {item.track.features.energyLevel && (
                          <span>Energy: {Math.round(item.track.features.energyLevel * 100)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compatibility score */}
                {item.compatibilityScore && (
                  <div className="flex-shrink-0 text-right mr-4">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(item.compatibilityScore.overall * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">match</div>
                    
                    {/* Compatibility breakdown */}
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="w-8 text-gray-400">BPM:</span>
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-green-400 h-1 rounded-full" 
                            style={{ width: `${item.compatibilityScore.tempo * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="w-8 text-gray-400">Key:</span>
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full" 
                            style={{ width: `${item.compatibilityScore.key * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Feedback Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <UserFeedbackButtons
                    track={item.track}
                    userId={userId}
                    playlistPosition={index}
                    sessionId={sessionId}
                    onFeedback={(action) => handleFeedback(item.track.id, action)}
                  />
                  
                  {/* Track quality indicator */}
                  {item.compatibilityScore && (
                    <div className="text-xs text-gray-500">
                      AI Match: {Math.round(item.compatibilityScore.overall * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transition Analysis Section */}
            {index < tracks.length - 1 && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center space-x-4 bg-gray-50 rounded-lg px-4 py-2">
                  {/* Transition Arrow */}
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>

                  {/* Analyze Transition Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTransitionAnalysis(item.track, tracks[index + 1].track);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    🎛️ Analyze Transition
                  </button>

                  {/* Quick transition info */}
                  {item.compatibilityScore && (
                    <div className="text-xs text-gray-600">
                      {Math.round(item.compatibilityScore.overall * 100)}% compatibility
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transition Analysis Modal */}
      <TransitionAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={closeTransitionAnalysis}
        fromTrack={selectedTransition?.from || null}
        toTrack={selectedTransition?.to || null}
      />
    </>
  );
} 