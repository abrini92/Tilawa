import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../lib/store';
import CommentsSection from './CommentsSection';
import { getCachedAudio, cacheAudio } from '../lib/offline-cache';
// Audio queue will be handled by the store

interface AudioPlayerProps {
  recitation: {
    id: string;
    reciter_name: string;
    surah_name: string;
    surah_number: number;
    duration: string;
    audio_url?: string;
  };
  onClose: () => void;
}

export default function AudioPlayer({ recitation, onClose }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Use global store
  const { 
    sound, 
    isPlaying, 
    position, 
    duration,
    setSound,
    setIsPlaying,
    setPosition,
    setDuration,
    setCurrentRecitation,
    incrementPlays
  } = useAppStore();

  // Load audio on mount
  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Update playback status
  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }
  }, [sound]);

  const loadAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Check if audio is cached locally
      let audioUrl = recitation.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      
      const cachedPath = await getCachedAudio(recitation.id);
      if (cachedPath) {
        console.log('Using cached audio:', cachedPath);
        audioUrl = cachedPath;
      } else if (recitation.audio_url) {
        // Cache audio in background for next time
        console.log('Caching audio for offline use...');
        cacheAudio(
          recitation.id,
          recitation.audio_url,
          recitation.surah_name,
          recitation.reciter_name
        ).catch(err => console.error('Failed to cache audio:', err));
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load audio:', error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000);
      setIsPlaying(status.isPlaying);
      
      // Update progress animation
      const progress = status.positionMillis / status.durationMillis;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();

      // Auto-play next or close when finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // TODO: Play next recitation in queue
        // For now, just close the player
        setTimeout(() => {
          onClose();
        }, 500);
      }
    }
  };

  const playPauseAudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const seekAudio = async (value: number) => {
    if (!sound || !duration) return;
    
    const seekPosition = value * duration * 1000;
    await sound.setPositionAsync(seekPosition);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Recitation Info */}
      <View style={styles.infoContainer}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {recitation.reciter_name.charAt(0)}
          </Text>
        </View>
        <Text style={styles.reciterName}>{recitation.reciter_name}</Text>
        <Text style={styles.surahName}>
          Surah {recitation.surah_number}: {recitation.surah_name}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity 
          style={styles.progressBar}
          activeOpacity={0.8}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const { width } = e.nativeEvent.target as any;
            const progress = locationX / width;
            seekAudio(progress);
          }}
        >
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </TouchableOpacity>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#10b981" />
        ) : (
          <>
            <TouchableOpacity style={styles.controlButton} disabled>
              <Text style={[styles.controlIcon, { opacity: 0.3 }]}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={playPauseAudio}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} disabled>
              <Text style={[styles.controlIcon, { opacity: 0.3 }]}>⏭</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Comments Section */}
      <CommentsSection recitationId={recitation.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeText: {
    fontSize: 20,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  placeholder: {
    width: 40,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  avatarLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarLargeText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
  },
  reciterName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  surahName: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 32,
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  controlIcon: {
    fontSize: 24,
    color: '#64748b',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  playButtonActive: {
    backgroundColor: '#059669',
    transform: [{ scale: 0.95 }],
  },
  playIcon: {
    fontSize: 32,
    color: '#fff',
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
