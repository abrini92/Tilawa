/**
 * Global App Store - Zustand
 * Centralized state management for Tilawa
 */

import { create } from 'zustand';
import { Audio } from 'expo-av';

// Types
export interface Recitation {
  id: string;
  reciter_name: string;
  reciter_avatar?: string;
  surah_name: string;
  surah_number: number;
  duration: string;
  plays: number;
  likes?: number;
  audio_url?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AppState {
  // Audio Player State
  currentRecitation: Recitation | null;
  sound: Audio.Sound | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Recitation[];
  
  // Feed State
  recitations: Recitation[];
  feedLoading: boolean;
  
  // User State
  user: User | null;
  
  // Actions - Audio
  setCurrentRecitation: (recitation: Recitation | null) => void;
  setSound: (sound: Audio.Sound | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  addToQueue: (recitation: Recitation) => void;
  clearQueue: () => void;
  
  // Actions - Feed
  setRecitations: (recitations: Recitation[]) => void;
  setFeedLoading: (loading: boolean) => void;
  likeRecitation: (id: string) => void;
  incrementPlays: (id: string) => void;
  
  // Actions - User
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  currentRecitation: null,
  sound: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  recitations: [],
  feedLoading: false,
  user: null,
  
  // Audio Actions
  setCurrentRecitation: (recitation) => set({ currentRecitation: recitation }),
  setSound: (sound) => set({ sound }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  
  addToQueue: (recitation) => set((state) => ({
    queue: [...state.queue, recitation],
  })),
  
  clearQueue: () => set({ queue: [] }),
  
  // Feed Actions
  setRecitations: (recitations) => set({ recitations }),
  setFeedLoading: (loading) => set({ feedLoading: loading }),
  
  likeRecitation: (id) => set((state) => ({
    recitations: state.recitations.map((r) =>
      r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r
    ),
  })),
  
  incrementPlays: (id) => set((state) => ({
    recitations: state.recitations.map((r) =>
      r.id === id ? { ...r, plays: r.plays + 1 } : r
    ),
  })),
  
  // User Actions
  setUser: (user) => set({ user }),
}));
