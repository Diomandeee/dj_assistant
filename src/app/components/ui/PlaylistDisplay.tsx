'use client';

import { Track, CompatibilityScore } from '@/types';

interface PlaylistItem {
  track: Track;
  position: number;
  compatibilityScore?: CompatibilityScore;
}

interface PlaylistDisplayProps {
  tracks: PlaylistItem[];
  isLoading?: boolean;
  onTrackSelect?: (track: Track) => void;
}

export function PlaylistDisplay({ tracks, isLoading, onTrackSelect }: PlaylistDisplayProps) {
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
    <div className="space-y-2">
      {tracks.map((item, index) => (
        <div
          key={item.track.id}
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
              <div className="flex-shrink-0 text-right">
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

          {/* Transition hint for next track */}
          {index < tracks.length - 1 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-400">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Suggested transition: Beatmatch at 2:30 → 0:15
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 