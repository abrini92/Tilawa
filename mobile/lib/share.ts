/**
 * Share Service
 * Share recitations via native share sheet
 */

import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { trackEvent } from './analytics';
import { generateShareCard } from '../components/ShareCard';

export interface ShareRecitationParams {
  recitationId: string;
  surahName: string;
  surahNumber?: number;
  reciterName: string;
  audioUrl?: string;
  duration?: string;
  plays?: number;
}

/**
 * Share a recitation
 */
export async function shareRecitation(params: ShareRecitationParams) {
  const { recitationId, surahName, surahNumber, reciterName, audioUrl, duration, plays } = params;

  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      Alert.alert('Sharing not available', 'Sharing is not available on this device');
      return;
    }

    // Generate premium share card message
    const message = await generateShareCard({
      reciterName,
      surahName,
      surahNumber: surahNumber || 0,
      duration,
      plays,
    });

    // If audio URL is available, share the audio file
    if (audioUrl) {
      try {
        await Sharing.shareAsync(audioUrl, {
          dialogTitle: `Share ${surahName}`,
          mimeType: 'audio/m4a',
        });
        
        trackEvent('recitation_shared', {
          recitationId,
          surahName,
          method: 'audio',
        });
      } catch (error) {
        console.error('Error sharing audio:', error);
        // Fallback to text share
        shareText(message, recitationId, surahName);
      }
    } else {
      // Share text only
      shareText(message, recitationId, surahName);
    }
  } catch (error) {
    console.error('Error sharing:', error);
    Alert.alert('Error', 'Failed to share recitation');
  }
}

/**
 * Share text (fallback)
 */
async function shareText(message: string, recitationId: string, surahName: string) {
  try {
    // For text sharing, we can use the Share API from React Native
    const { Share } = require('react-native');
    
    await Share.share({
      message,
      title: `Share ${surahName}`,
    });

    trackEvent('recitation_shared', {
      recitationId,
      surahName,
      method: 'text',
    });
  } catch (error) {
    console.error('Error sharing text:', error);
  }
}

/**
 * Share app (invite friends)
 */
export async function shareApp() {
  const message = `🎙️ Discover Tilawa - The platform for Quran reciters!\n\n✨ Upload your recitations\n🎧 Listen to amazing reciters\n📱 Join the community\n\n Download: https://tilawa.app\n\n#Tilawa #Quran #IslamicApp`;

  try {
    const { Share } = require('react-native');
    
    await Share.share({
      message,
      title: 'Join Tilawa',
    });

    trackEvent('app_shared');
  } catch (error) {
    console.error('Error sharing app:', error);
  }
}
