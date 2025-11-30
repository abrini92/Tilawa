import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore - Fuse.js types may not be available
let Fuse: any;
try {
  Fuse = require('fuse.js');
} catch (e) {
  console.warn('Fuse.js not available, search will be basic');
}

export interface Surah {
  number: number;
  name: {
    arabic: string;
    transliteration: string;
    translation: {
      en: string;
    };
  };
  verses: number;
  revelationType: 'Meccan' | 'Medinan';
}

// Fetch all 114 surahs from Quran.com API
async function fetchAllSurahs(): Promise<Surah[]> {
  try {
    const response = await fetch('https://api.quran.com/api/v4/chapters');
    const data = await response.json();
    
    return data.chapters.map((chapter: any) => ({
      number: chapter.id,
      name: {
        arabic: chapter.name_arabic,
        transliteration: chapter.name_simple,
        translation: {
          en: chapter.translated_name.name,
        },
      },
      verses: chapter.verses_count,
      revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
    }));
  } catch (error) {
    console.error('Failed to fetch surahs from API:', error);
    // Fallback to embedded data if API fails
    return [];
  }
}

interface SurahStore {
  // Data
  surahs: Surah[];
  favorites: number[];
  lastRecitedSurah: number | null;
  currentIndex: number;
  
  // Search
  searchQuery: string;
  searchResults: Surah[];
  
  // Actions
  loadSurahs: () => void;
  setCurrentIndex: (index: number) => void;
  toggleFavorite: (surahNumber: number) => Promise<void>;
  setLastRecited: (surahNumber: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  
  // Computed
  getFavoriteSurahs: () => Surah[];
  getCurrentSurah: () => Surah;
  getInitialIndex: () => number;
}

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    'name.transliteration',
    'name.arabic',
    'name.translation.en',
    'number',
  ],
  threshold: 0.3,
  includeScore: true,
};

export const useSurahStore = create<SurahStore>()(
  persist(
    (set, get) => ({
      // Initial state
      surahs: [],
      favorites: [],
      lastRecitedSurah: null,
      currentIndex: 0,
      searchQuery: '',
      searchResults: [],

      // Actions
      loadSurahs: async () => {
        const surahs = await fetchAllSurahs();
        set({ surahs });
      },

      setCurrentIndex: (index: number) => {
        set({ currentIndex: index });
      },

      toggleFavorite: async (surahNumber: number) => {
        const { favorites } = get();
        const isFavorited = favorites.includes(surahNumber);
        
        if (isFavorited) {
          // Remove from favorites
          set({ favorites: favorites.filter(num => num !== surahNumber) });
        } else {
          // Add to favorites (max 20)
          if (favorites.length >= 20) {
            console.warn('Maximum 20 favorites reached');
            return;
          }
          set({ favorites: [...favorites, surahNumber] });
        }
        
        // TODO: Sync with Supabase
        // await supabase.from('user_favorites').upsert(...)
      },

      setLastRecited: async (surahNumber: number) => {
        set({ lastRecitedSurah: surahNumber });
        
        // TODO: Sync with Supabase
        // await supabase.from('user_recitations').insert(...)
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        
        if (!query.trim()) {
          set({ searchResults: [] });
          return;
        }
        
        const { surahs } = get();
        
        // Handle special filters
        if (query.toLowerCase() === 'short') {
          set({ searchResults: surahs.filter(s => s.verses < 20) });
          return;
        }
        if (query.toLowerCase() === 'medium') {
          set({ searchResults: surahs.filter(s => s.verses >= 20 && s.verses <= 100) });
          return;
        }
        if (query.toLowerCase() === 'long') {
          set({ searchResults: surahs.filter(s => s.verses > 100) });
          return;
        }
        if (query.toLowerCase() === 'meccan') {
          set({ searchResults: surahs.filter(s => s.revelationType === 'Meccan') });
          return;
        }
        if (query.toLowerCase() === 'medinan') {
          set({ searchResults: surahs.filter(s => s.revelationType === 'Medinan') });
          return;
        }
        
        // Fuzzy search (if Fuse.js available)
        if (Fuse) {
          const fuse = new Fuse(surahs, fuseOptions);
          const results = fuse.search(query);
          set({ searchResults: results.map((r: any) => r.item) });
        } else {
          // Fallback: basic search
          const lowerQuery = query.toLowerCase();
          const results = surahs.filter(s => 
            s.name.transliteration.toLowerCase().includes(lowerQuery) ||
            s.name.arabic.includes(query) ||
            s.number.toString() === query
          );
          set({ searchResults: results });
        }
      },

      // Computed
      getFavoriteSurahs: () => {
        const { surahs, favorites } = get();
        return surahs.filter(s => favorites.includes(s.number));
      },

      getCurrentSurah: () => {
        const { surahs, currentIndex } = get();
        return surahs[currentIndex] || surahs[0];
      },

      getInitialIndex: () => {
        const { surahs, lastRecitedSurah, favorites } = get();
        
        // Priority 1: Last recited
        if (lastRecitedSurah) {
          const index = surahs.findIndex(s => s.number === lastRecitedSurah);
          if (index !== -1) return index;
        }
        
        // Priority 2: First favorite
        if (favorites.length > 0) {
          const index = surahs.findIndex(s => s.number === favorites[0]);
          if (index !== -1) return index;
        }
        
        // Default: Al-Fatihah (index 0)
        return 0;
      },
    }),
    {
      name: 'surah-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        lastRecitedSurah: state.lastRecitedSurah,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
