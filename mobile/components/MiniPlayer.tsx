import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../lib/store';
import AnimatedWaveform from './AnimatedWaveform';
import * as Haptics from 'expo-haptics';

interface MiniPlayerProps {
  onPress: () => void;
}

export default function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { currentRecitation, isPlaying, setCurrentRecitation } = useAppStore();
  const translateY = useRef(new Animated.Value(0)).current;
  const [progress] = useState(0.3); // TODO: Get real progress

  if (!currentRecitation) return null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down to dismiss
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.timing(translateY, {
            toValue: 200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentRecitation(null);
            translateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handlePlayPause = async (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement play/pause from store
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress * 100}%` }]}
        />
      </View>

      {/* Swipe indicator */}
      <View style={styles.swipeIndicator} />

      <TouchableOpacity 
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.9}
      >
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
          {/* Mini waveform */}
          <View style={styles.miniWaveform}>
            <AnimatedWaveform 
              isPlaying={isPlaying} 
              barCount={20} 
              height={16} 
              color="#10b981" 
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          <Text style={styles.playIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
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
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  progressBar: {
    height: '100%',
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  miniWaveform: {
    marginTop: 4,
    height: 16,
  },
});
