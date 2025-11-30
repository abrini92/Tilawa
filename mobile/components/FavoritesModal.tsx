import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore - Carousel types may not be perfect
import Carousel from 'react-native-snap-carousel';
import { useSurahStore, type Surah } from '../lib/surahStore';
import { SurahCard } from './SurahCard';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (surah: Surah) => void;
}

export function FavoritesModal({ visible, onClose, onSelect }: FavoritesModalProps) {
  const { getFavoriteSurahs, favorites, toggleFavorite } = useSurahStore();
  const favoriteSurahs = getFavoriteSurahs();

  const handleSelect = (surah: Surah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(surah);
    onClose();
  };

  const handleDoubleTap = (surahNumber: number) => {
    toggleFavorite(surahNumber);
  };

  if (favoriteSurahs.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Favorites</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyDescription}>
              Double-tap any Surah to add it to your favorites
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Favorites</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#718096" />
          </TouchableOpacity>
        </View>

        <Carousel
          data={favoriteSurahs}
          renderItem={({ item }: { item: Surah }) => (
            <SurahCard
              surah={item}
              isActive={true}
              isFavorite={true}
              onPress={() => handleSelect(item)}
              onDoubleTap={() => handleDoubleTap(item.number)}
              onLongPress={() => {}}
            />
          )}
          sliderWidth={SCREEN_WIDTH}
          itemWidth={SCREEN_WIDTH * 0.85}
          inactiveSlideScale={0.9}
          inactiveSlideOpacity={0.6}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
  },
});
