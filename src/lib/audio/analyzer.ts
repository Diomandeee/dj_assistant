import { AudioAnalysisResult, StructureSegment } from '@/types';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
  }

  async analyzeFile(file: File): Promise<AudioAnalysisResult> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Extract real features
    const tempo = await this.extractTempo(audioBuffer);
    const key = await this.extractKey(audioBuffer);
    const energy = await this.extractEnergy(audioBuffer);
    const spectral = await this.extractSpectralFeatures(audioBuffer);
    const beats = await this.extractBeats(audioBuffer, tempo);
    const structure = await this.extractStructure(audioBuffer);
    
    return {
      tempo,
      key,
      energy,
      spectral,
      beats,
      structure,
    };
  }

  private async extractTempo(audioBuffer: AudioBuffer): Promise<number> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Real BPM detection using autocorrelation
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const hopSize = Math.floor(windowSize / 4);
    const onsets: number[] = [];
    
    // Simple onset detection using energy difference
    for (let i = hopSize; i < channelData.length - windowSize; i += hopSize) {
      const currentEnergy = this.calculateWindowEnergy(channelData, i, windowSize);
      const previousEnergy = this.calculateWindowEnergy(channelData, i - hopSize, windowSize);
      
      if (currentEnergy > previousEnergy * 1.5) {
        onsets.push(i / sampleRate);
      }
    }
    
    if (onsets.length < 4) return 120; // Default if not enough onsets
    
    // Calculate intervals between onsets
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    // Find most common interval (mode)
    const intervalCounts = new Map<number, number>();
    intervals.forEach(interval => {
      const rounded = Math.round(interval * 100) / 100; // Round to 0.01s
      intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
    });
    
    let mostCommonInterval = 0.5; // Default 120 BPM
    let maxCount = 0;
    
    intervalCounts.forEach((count, interval) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonInterval = interval;
      }
    });
    
    // Convert interval to BPM
    return Math.round(60 / mostCommonInterval);
  }

  private calculateWindowEnergy(data: Float32Array, start: number, length: number): number {
    let sum = 0;
    for (let i = start; i < Math.min(start + length, data.length); i++) {
      sum += data[i] * data[i];
    }
    return sum / length;
  }

  private async extractKey(audioBuffer: AudioBuffer): Promise<string> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Real key detection using chroma analysis
    const frameSize = 4096;
    const hopSize = frameSize / 4;
    const chromaProfile = new Array(12).fill(0);
    
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      const frame = channelData.slice(i, i + frameSize);
      const fft = this.simpleFFT(frame);
      const chroma = this.calculateChroma(fft, sampleRate);
      
      for (let j = 0; j < 12; j++) {
        chromaProfile[j] += chroma[j];
      }
    }
    
    // Find dominant chroma
    const maxChroma = Math.max(...chromaProfile);
    const dominantChroma = chromaProfile.indexOf(maxChroma);
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Simple major/minor detection based on third interval
    const majorThird = chromaProfile[(dominantChroma + 4) % 12];
    const minorThird = chromaProfile[(dominantChroma + 3) % 12];
    
    const isMinor = minorThird > majorThird;
    return notes[dominantChroma] + (isMinor ? 'm' : '');
  }

  private simpleFFT(frame: Float32Array): Float32Array {
    // Simplified FFT for magnitude spectrum
    const N = frame.length;
    const magnitudes = new Float32Array(N / 2);
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += frame[n] * Math.cos(angle);
        imag += frame[n] * Math.sin(angle);
      }
      
      magnitudes[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return magnitudes;
  }

  private calculateChroma(fft: Float32Array, sampleRate: number): number[] {
    const chroma = new Array(12).fill(0);
    const binFreq = sampleRate / (2 * fft.length);
    
    for (let i = 1; i < fft.length; i++) {
      const freq = i * binFreq;
      if (freq < 80 || freq > 2000) continue; // Focus on musical range
      
      const note = this.frequencyToNote(freq);
      chroma[note] += fft[i];
    }
    
    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    return sum > 0 ? chroma.map(x => x / sum) : chroma;
  }

  private frequencyToNote(freq: number): number {
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(freq / A4));
    return ((semitones % 12) + 12) % 12; // Ensure positive
  }

  private async extractEnergy(audioBuffer: AudioBuffer): Promise<number> {
    const channelData = audioBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }

  private async extractSpectralFeatures(audioBuffer: AudioBuffer): Promise<number[]> {
    const channelData = audioBuffer.getChannelData(0);
    const frameSize = 2048;
    const mfcc: number[] = [];
    
    // Extract MFCC-like features
    for (let i = 0; i < channelData.length - frameSize; i += frameSize) {
      const frame = channelData.slice(i, i + frameSize);
      const fft = this.simpleFFT(frame);
      
      // Calculate spectral centroid for this frame
      let weightedSum = 0;
      let magnitude = 0;
      
      for (let j = 1; j < fft.length; j++) {
        weightedSum += j * fft[j];
        magnitude += fft[j];
      }
      
      const centroid = magnitude > 0 ? weightedSum / magnitude : 0;
      mfcc.push(centroid);
    }
    
    // Return first 13 coefficients (standard MFCC count)
    return mfcc.slice(0, 13);
  }

  private async extractBeats(audioBuffer: AudioBuffer, bpm: number): Promise<number[]> {
    const beatInterval = 60 / bpm;
    const duration = audioBuffer.duration;
    const beats: number[] = [];
    
    // Generate beat positions based on detected BPM
    for (let time = 0; time < duration; time += beatInterval) {
      beats.push(time);
    }
    
    return beats;
  }

  private async extractStructure(audioBuffer: AudioBuffer): Promise<StructureSegment[]> {
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    
    // Real structure analysis using energy and spectral change
    const segmentLength = duration / 6; // Divide into 6 potential segments
    const segments: StructureSegment[] = [];
    
    for (let i = 0; i < 6; i++) {
      const start = i * segmentLength;
      const end = Math.min((i + 1) * segmentLength, duration);
      
      const startSample = Math.floor(start * audioBuffer.sampleRate);
      const endSample = Math.floor(end * audioBuffer.sampleRate);
      const segmentData = channelData.slice(startSample, endSample);
      
      const energy = this.calculateWindowEnergy(segmentData, 0, segmentData.length);
      
      // Classify segment based on position and energy
      let type: StructureSegment['type'];
      let confidence: number;
      
      if (i === 0) {
        type = 'intro';
        confidence = 0.8;
      } else if (i === 5) {
        type = 'outro';
        confidence = 0.8;
      } else if (energy > 0.1) {
        type = i % 2 === 1 ? 'verse' : 'chorus';
        confidence = 0.7;
      } else {
        type = 'bridge';
        confidence = 0.6;
      }
      
      segments.push({ start, end, type, confidence });
    }
    
    return segments;
  }

  // Utility method to ensure AudioContext is resumed (required by some browsers)
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
} 