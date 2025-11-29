/**
 * Audio Queue Manager
 * Handles sequential playback of multiple audio files
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export interface AudioTrack {
  url: string;
  title: string;
  duration?: number;
}

export class AudioQueue {
  private sound: Audio.Sound | null = null;
  private playlist: AudioTrack[] = [];
  private currentIndex: number = 0;
  private onStatusUpdate?: (status: any) => void;
  private onTrackChange?: (index: number) => void;
  private onQueueComplete?: () => void;

  constructor(
    onStatusUpdate?: (status: any) => void,
    onTrackChange?: (index: number) => void,
    onQueueComplete?: () => void
  ) {
    this.onStatusUpdate = onStatusUpdate;
    this.onTrackChange = onTrackChange;
    this.onQueueComplete = onQueueComplete;
  }

  async initialize(tracks: AudioTrack[]) {
    this.playlist = tracks;
    this.currentIndex = 0;
    
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  async play() {
    if (this.currentIndex >= this.playlist.length) {
      this.onQueueComplete?.();
      return;
    }

    const track = this.playlist[this.currentIndex];
    
    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true },
        this.handlePlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.onTrackChange?.(this.currentIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to play track:', error);
      // Skip to next track on error
      await this.next();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async resume() {
    if (this.sound) {
      await this.sound.playAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async next() {
    this.currentIndex++;
    await this.play();
  }

  async previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.play();
    }
  }

  async seek(positionMillis: number) {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
    }
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async cleanup() {
    await this.stop();
    this.playlist = [];
    this.currentIndex = 0;
  }

  getCurrentTrack(): AudioTrack | null {
    return this.playlist[this.currentIndex] || null;
  }

  getPlaylist(): AudioTrack[] {
    return this.playlist;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  private handlePlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      this.onStatusUpdate?.(status);

      // Auto-play next track when current finishes
      if (status.didJustFinish && !status.isLooping) {
        this.next();
      }
    }
  }
}

// Singleton instance
let audioQueueInstance: AudioQueue | null = null;

export function getAudioQueue(
  onStatusUpdate?: (status: any) => void,
  onTrackChange?: (index: number) => void,
  onQueueComplete?: () => void
): AudioQueue {
  if (!audioQueueInstance) {
    audioQueueInstance = new AudioQueue(
      onStatusUpdate,
      onTrackChange,
      onQueueComplete
    );
  }
  return audioQueueInstance;
}

export function resetAudioQueue() {
  if (audioQueueInstance) {
    audioQueueInstance.cleanup();
    audioQueueInstance = null;
  }
}
