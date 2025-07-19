'use client';

import { useState, useEffect } from 'react';
import { Track, CompatibilityScore } from '@/types';
import { TrackUploader } from './components/ui/TrackUploader';
import { PlaylistDisplay } from './components/ui/PlaylistDisplay';
import { LearningInsights } from './components/ui/UserFeedbackButtons';

interface PlaylistItem {
  track: Track;
  position: number;
  compatibilityScore?: CompatibilityScore;
}

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedSeedTrack, setSelectedSeedTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User context for learning system
  const [userId] = useState('demo-user'); // In a real app, this would come from authentication
  const [sessionId] = useState(`session-${Date.now()}`);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const response = await fetch('/api/tracks');
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  const handleTrackUploaded = (newTrack: Track) => {
    setTracks(prev => [...prev, newTrack]);
  };

  const handleSeedTrackSelect = (track: Track) => {
    setSelectedSeedTrack(track);
    setError(null);
  };

  const generatePlaylist = async () => {
    if (!selectedSeedTrack) {
      setError('Please select a seed track first');
      return;
    }

    setIsGeneratingPlaylist(true);
    setError(null);

    try {
      const response = await fetch('/api/playlists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedTrackId: selectedSeedTrack.id,
          playlistLength: 8,
          userId, // Include user context for personalization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }

      const data = await response.json();
      
      // Convert to PlaylistItem format
      const playlistItems: PlaylistItem[] = data.tracks.map((track: Track & { compatibilityScore?: CompatibilityScore }, index: number) => ({
        track,
        position: index,
        compatibilityScore: track.compatibilityScore
      }));

      setPlaylist(playlistItems);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate playlist');
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  const handlePlaylistTrackSelect = (track: Track) => {
    console.log('Selected playlist track:', track);
    // Could open track details, start playback, etc.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎧 AI DJ Assistant
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Intelligent Playlist Generation with Advanced Transition Analysis
          </p>
          <p className="text-sm text-gray-500">
            Upload tracks, select a seed, and let AI create the perfect mix with smart learning
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Library */}
          <div className="space-y-6">
            {/* Track Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Track</h2>
              <TrackUploader onTrackUploaded={handleTrackUploaded} />
            </div>

            {/* Track Library */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Track Library ({tracks.length})
              </h2>
              
              {tracks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No tracks uploaded yet</p>
                  <p className="text-gray-400 text-xs mt-1">Upload audio files to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`
                        p-3 rounded border cursor-pointer transition-all duration-200
                        ${selectedSeedTrack?.id === track.id
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleSeedTrackSelect(track)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {track.title || track.filename}
                          </h3>
                          {track.artist && (
                            <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                          )}
                          
                          {/* Track features */}
                          {track.features && (
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              {track.features.tempo && (
                                <span>{Math.round(track.features.tempo)} BPM</span>
                              )}
                              {track.features.musicalKey && (
                                <span>Key: {track.features.musicalKey}</span>
                              )}
                              {track.features.energyLevel && (
                                <span>Energy: {Math.round(track.features.energyLevel * 100)}%</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {selectedSeedTrack?.id === track.id && (
                          <div className="ml-2 text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Insights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <LearningInsights userId={userId} />
            </div>
          </div>

          {/* Right Column - Playlist Generation & Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Playlist Generation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generate Playlist</h2>
                {selectedSeedTrack && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Seed: {selectedSeedTrack.title || selectedSeedTrack.filename}
                  </span>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={generatePlaylist}
                  disabled={!selectedSeedTrack || isGeneratingPlaylist}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isGeneratingPlaylist ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating AI Playlist...</span>
                    </div>
                  ) : (
                    '🎵 Generate Smart Playlist'
                  )}
                </button>

                {playlist.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {playlist.length} tracks • AI-optimized transitions
                  </div>
                )}
              </div>
            </div>

            {/* Playlist Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Smart Playlist</h2>
                {playlist.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Session: {sessionId.slice(-8)}
                  </div>
                )}
              </div>
              
              <PlaylistDisplay 
                tracks={playlist}
                isLoading={isGeneratingPlaylist}
                onTrackSelect={handlePlaylistTrackSelect}
                userId={userId}
                sessionId={sessionId}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>AI-powered DJ assistance with real-time learning and transition optimization</p>
          <p className="mt-1">Built with Next.js, Prisma, and advanced audio analysis</p>
        </div>
      </div>
    </div>
  );
}
