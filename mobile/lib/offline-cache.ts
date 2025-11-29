/**
 * Offline Cache Manager
 * Cache audio files locally for offline playback
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.documentDirectory}audio_cache/`;
const CACHE_INDEX_KEY = '@tilawa_audio_cache_index';

interface CachedAudio {
  id: string;
  url: string;
  localPath: string;
  surahName: string;
  reciterName: string;
  cachedAt: number;
  size: number;
}

/**
 * Initialize cache directory
 */
export async function initializeCache() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
}

/**
 * Get cache index
 */
async function getCacheIndex(): Promise<CachedAudio[]> {
  try {
    const index = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Error reading cache index:', error);
    return [];
  }
}

/**
 * Save cache index
 */
async function saveCacheIndex(index: CachedAudio[]) {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Error saving cache index:', error);
  }
}

/**
 * Cache an audio file
 */
export async function cacheAudio(
  id: string,
  url: string,
  surahName: string,
  reciterName: string
): Promise<string | null> {
  try {
    await initializeCache();

    // Check if already cached
    const index = await getCacheIndex();
    const existing = index.find(item => item.id === id);
    if (existing) {
      const fileExists = await FileSystem.getInfoAsync(existing.localPath);
      if (fileExists.exists) {
        return existing.localPath;
      }
    }

    // Download file
    const fileName = `${id}.m4a`;
    const localPath = `${CACHE_DIR}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(url, localPath);

    if (downloadResult.status === 200) {
      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // Update index
      const newEntry: CachedAudio = {
        id,
        url,
        localPath,
        surahName,
        reciterName,
        cachedAt: Date.now(),
        size,
      };

      const updatedIndex = [...index.filter(item => item.id !== id), newEntry];
      await saveCacheIndex(updatedIndex);

      return localPath;
    }

    return null;
  } catch (error) {
    console.error('Error caching audio:', error);
    return null;
  }
}

/**
 * Get cached audio path
 */
export async function getCachedAudio(id: string): Promise<string | null> {
  try {
    const index = await getCacheIndex();
    const cached = index.find(item => item.id === id);

    if (cached) {
      const fileExists = await FileSystem.getInfoAsync(cached.localPath);
      if (fileExists.exists) {
        return cached.localPath;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting cached audio:', error);
    return null;
  }
}

/**
 * Check if audio is cached
 */
export async function isAudioCached(id: string): Promise<boolean> {
  const path = await getCachedAudio(id);
  return path !== null;
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  try {
    const index = await getCacheIndex();
    return index.reduce((total, item) => total + item.size, 0);
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

/**
 * Clear cache
 */
export async function clearCache() {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    await initializeCache();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get all cached audios
 */
export async function getAllCachedAudios(): Promise<CachedAudio[]> {
  return await getCacheIndex();
}

/**
 * Remove specific cached audio
 */
export async function removeCachedAudio(id: string) {
  try {
    const index = await getCacheIndex();
    const cached = index.find(item => item.id === id);

    if (cached) {
      await FileSystem.deleteAsync(cached.localPath, { idempotent: true });
      const updatedIndex = index.filter(item => item.id !== id);
      await saveCacheIndex(updatedIndex);
    }
  } catch (error) {
    console.error('Error removing cached audio:', error);
  }
}
