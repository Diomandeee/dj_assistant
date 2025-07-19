'use client';

import { useState, useEffect } from 'react';
import { TrackUploader } from './components/ui/TrackUploader';
import { PlaylistDisplay } from './components/ui/PlaylistDisplay';
import { Track } from '@/types';

interface PlaylistItem {
  track: Track;
  position: number;
  compatibilityScore?: any;
}

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  // Load existing tracks on component mount
  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch('/api/tracks');
      if (response.ok) {
        const tracksData = await response.json();
        setTracks(tracksData);
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleTrackUploaded = (track: Track) => {
    setTracks(prev => [track, ...prev]);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  const handleGeneratePlaylist = async () => {
    if (!selectedTrack) return;
    
    setIsGeneratingPlaylist(true);
    try {
      const response = await fetch('/api/playlists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seedTrackId: selectedTrack.id,
          playlistLength: 8
        }),
      });
      
      if (response.ok) {
        const generatedPlaylist = await response.json();
        setPlaylist(generatedPlaylist.tracks || []);
      } else {
        console.error('Playlist generation failed');
      }
    } catch (error) {
      console.error('Playlist generation error:', error);
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DJ</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">DJ Assistant</h1>
            </div>
            <div className="text-sm text-gray-500">
              AI-Powered Playlist Generation
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Track Management */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Track</h2>
              <TrackUploader onTrackUploaded={handleTrackUploaded} />
            </div>

            {/* Track Library */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Track Library ({tracks.length})
              </h2>
              
              {isLoadingTracks ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded p-3 h-12"></div>
                    </div>
                  ))}
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No tracks uploaded yet</p>
                  <p className="text-gray-400 text-xs mt-1">Upload your first track to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${selectedTrack?.id === track.id 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                      onClick={() => handleTrackSelect(track)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 truncate">
                            {track.title || track.filename}
                          </h3>
                          {track.artist && (
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                          )}
                          {track.features && (
                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                              {track.features.tempo && (
                                <span>{Math.round(track.features.tempo)} BPM</span>
                              )}
                              {track.features.musicalKey && (
                                <span>{track.features.musicalKey}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedTrack?.id === track.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Playlist Generation */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Playlist Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Generated Playlist</h2>
                <button
                  onClick={handleGeneratePlaylist}
                  disabled={!selectedTrack || isGeneratingPlaylist}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                    ${selectedTrack && !isGeneratingPlaylist
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isGeneratingPlaylist ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Playlist'
                  )}
                </button>
              </div>

              {!selectedTrack && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    💡 Select a track from your library to use as the seed for playlist generation
                  </p>
                </div>
              )}

              {selectedTrack && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-800 text-sm">🎵 Seed track:</span>
                    <span className="font-medium text-green-900 text-sm">
                      {selectedTrack.title || selectedTrack.filename}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <PlaylistDisplay 
                tracks={playlist}
                isLoading={isGeneratingPlaylist}
                onTrackSelect={handleTrackSelect}
              />
            </div>

            {/* Tips Section */}
            {playlist.length === 0 && !isGeneratingPlaylist && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <p><strong>Upload tracks:</strong> Add your music files to build your library</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <p><strong>Select seed track:</strong> Choose the track you want to start your set with</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <p><strong>Generate playlist:</strong> AI analyzes tempo, key, and energy to create optimal flow</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <p><strong>Get transition tips:</strong> View suggested mixing points and techniques</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
