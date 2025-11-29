import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAppStore } from '../lib/store';
import * as Haptics from 'expo-haptics';

interface MiniPlayerProps {
  onPress: () => void;
}

export default function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { currentRecitation, isPlaying } = useAppStore();

  if (!currentRecitation) return null;

  const handlePlayPause = async (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement play/pause from store
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentRecitation.reciter_name.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.surahName} numberOfLines={1}>
            {currentRecitation.surah_name}
          </Text>
          <Text style={styles.reciterName} numberOfLines={1}>
            {currentRecitation.reciter_name}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          <Text style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  info: {
    flex: 1,
  },
  surahName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  reciterName: {
    fontSize: 13,
    color: '#64748b',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 2,
  },
});
