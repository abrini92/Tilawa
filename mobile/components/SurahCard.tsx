import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IslamicPattern } from './IslamicPattern';
import { convertToArabicNumerals } from '../utils/timeGradient';
import type { Surah } from '../lib/surahStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SurahCardProps {
  surah: Surah;
  isActive: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
}

export function SurahCard({
  surah,
  isActive,
  isFavorite,
  onPress,
  onDoubleTap,
  onLongPress,
}: SurahCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={[styles.card, isActive ? styles.cardActive : styles.cardInactive]}>
        {/* Background: Watermark number */}
        <Text style={styles.numberWatermark}>{convertToArabicNumerals(surah.number)}</Text>

        {/* Main content */}
        <View style={styles.content}>
          {/* Arabic name - HERO */}
          <Text style={styles.arabicName}>{surah.name.arabic}</Text>

          {/* Transliteration */}
          <Text style={styles.transliteration}>{surah.name.transliteration}</Text>

          {/* Translation */}
          <Text style={styles.translation}>{surah.name.translation.en}</Text>

          {/* Separator */}
          <View style={styles.separator} />

          {/* Metadata */}
          <Text style={styles.metadata}>
            {surah.verses} ayat · {surah.revelationType}
          </Text>
        </View>

        {/* Geometric pattern */}
        <IslamicPattern opacity={0.05} color="#1B5E3F" />

        {/* Favorite indicator */}
        {isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={24} color="#E53E3E" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,

    // Android shadow
    elevation: 10,
  },

  numberWatermark: {
    position: 'absolute',
    top: 60,
    fontSize: 120,
    fontWeight: '700',
    color: '#1B5E3F',
    opacity: 0.2,
  },

  content: {
    alignItems: 'center',
    gap: 16,
  },

  arabicName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1B5E3F',
    textAlign: 'center',
    marginBottom: 8,
  },

  transliteration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },

  translation: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#718096',
    textAlign: 'center',
  },

  separator: {
    width: 60,
    height: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.3,
    marginVertical: 16,
  },

  metadata: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },

  favoriteIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  cardActive: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },

  cardInactive: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
});
