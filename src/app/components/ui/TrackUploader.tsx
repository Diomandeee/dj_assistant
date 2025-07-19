'use client';

import { useState } from 'react';
import { Track } from '@/types';
import { AudioAnalyzer } from '@/lib/audio/analyzer';

interface TrackUploaderProps {
  onTrackUploaded: (track: Track) => void;
}

export function TrackUploader({ onTrackUploaded }: TrackUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Uploading file...');
    
    try {
      // Step 1: Upload file to server
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const track = await uploadResponse.json();
      setUploadProgress('Analyzing audio...');
      setIsAnalyzing(true);

      // Step 2: Analyze audio on client side
      const analyzer = new AudioAnalyzer();
      await analyzer.resumeAudioContext(); // Ensure AudioContext is active
      
      const analysisResult = await analyzer.analyzeFile(file);
      
      // Step 3: Store analysis results on server
      const analysisResponse = await fetch(`/api/tracks/${track.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysisResult: {
            ...analysisResult,
            duration: file.size > 0 ? 180 : 0 // Placeholder duration
          }
        }),
      });

      if (!analysisResponse.ok) {
        console.warn('Failed to store analysis, but upload succeeded');
      }

      setUploadProgress('Complete!');
      onTrackUploaded(track);
      
    } catch (error) {
      console.error('Upload/analysis error:', error);
      setUploadProgress('Error occurred');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setTimeout(() => setUploadProgress(''), 2000);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <label className="cursor-pointer">
          <span className="text-sm font-medium text-gray-700">
            Click to upload audio file
          </span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
        
        <p className="text-xs text-gray-500 mt-2">
          MP3, WAV, M4A up to 50MB
        </p>
        
        {(isUploading || uploadProgress) && (
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              {isUploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              <span className="text-sm text-gray-600">{uploadProgress}</span>
            </div>
            
            {isAnalyzing && (
              <div className="mt-2 text-xs text-gray-500">
                Extracting tempo, key, and energy features...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 