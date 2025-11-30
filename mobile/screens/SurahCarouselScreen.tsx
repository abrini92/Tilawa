import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore - Carousel types may not be perfect
import Carousel from 'react-native-snap-carousel';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSurahStore, type Surah } from '../lib/surahStore';
import { SurahCard } from '../components/SurahCard';
import { PageIndicators } from '../components/PageIndicators';
import { StartRecordingButton } from '../components/StartRecordingButton';
import { SearchModal } from '../components/SearchModal';
import { FavoritesModal } from '../components/FavoritesModal';
import { HeartAnimation } from '../animations/heartAnimation';
import { getTimeBasedGradient } from '../utils/timeGradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SurahCarouselScreenProps {
  onStartRecording: (surah: Surah) => void;
}

export function SurahCarouselScreen({ onStartRecording }: SurahCarouselScreenProps) {
  const carouselRef = useRef<Carousel<Surah>>(null);
  const {
    surahs,
    currentIndex,
    favorites,
    setCurrentIndex,
    toggleFavorite,
    getInitialIndex,
    loadSurahs,
  } = useSurahStore();

  const [showSearch, setShowSearch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load surahs from API and initialize carousel position
  useEffect(() => {
    const initialize = async () => {
      await loadSurahs();
      const initialIndex = getInitialIndex();
      setCurrentIndex(initialIndex);
      carouselRef.current?.snapToItem(initialIndex, false);
      setIsLoading(false);
    };
    
    initialize();
  }, []);

  // Handle snap to item
  const handleSnapToItem = useCallback((index: number) => {
    setCurrentIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle card press (single tap)
  const handleCardPress = useCallback((surah: Surah) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      handleDoubleTap(surah);
    } else {
      // Single tap - start recording
      onStartRecording(surah);
    }

    setLastTap(now);
  }, [lastTap, onStartRecording]);

  // Handle double tap (favorite)
  const handleDoubleTap = useCallback((surah: Surah) => {
    toggleFavorite(surah.number);
    setShowHeartAnimation(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Handle long press (quick actions)
  const handleLongPress = useCallback((surah: Surah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', '🎙️ Start Recording', '⭐ Toggle Favorite', 'ℹ️ View Details'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onStartRecording(surah);
          } else if (buttonIndex === 2) {
            toggleFavorite(surah.number);
          } else if (buttonIndex === 3) {
            Alert.alert(
              surah.name.transliteration,
              `${surah.name.arabic}\n\n${surah.verses} ayat · ${surah.revelationType}`
            );
          }
        }
      );
    } else {
      // Android - use Alert
      Alert.alert(
        surah.name.transliteration,
        `${surah.name.arabic}\n\n${surah.verses} ayat · ${surah.revelationType}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: '🎙️ Start Recording', onPress: () => onStartRecording(surah) },
          { text: '⭐ Toggle Favorite', onPress: () => toggleFavorite(surah.number) },
        ]
      );
    }
  }, [onStartRecording]);

  // Handle search select
  const handleSearchSelect = useCallback((surah: Surah) => {
    const index = surahs.findIndex((s) => s.number === surah.number);
    if (index !== -1) {
      carouselRef.current?.snapToItem(index);
      setCurrentIndex(index);
    }
  }, [surahs]);

  // Handle favorites select
  const handleFavoritesSelect = useCallback((surah: Surah) => {
    const index = surahs.findIndex((s) => s.number === surah.number);
    if (index !== -1) {
      carouselRef.current?.snapToItem(index);
      setCurrentIndex(index);
    }
  }, [surahs]);

  // Render card
  const renderCard = useCallback(
    ({ item, index }: { item: Surah; index: number }) => (
      <SurahCard
        surah={item}
        isActive={index === currentIndex}
        isFavorite={favorites.includes(item.number)}
        onPress={() => handleCardPress(item)}
        onDoubleTap={() => handleDoubleTap(item)}
        onLongPress={() => handleLongPress(item)}
      />
    ),
    [currentIndex, favorites, handleCardPress, handleDoubleTap, handleLongPress]
  );

  // Show loading state while fetching surahs
  if (isLoading || surahs.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10b981', '#059669', '#047857']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Surahs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Emerald gradient background - MATCH DISCOVER */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFavorites(true);
          }}
        >
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSearch(true);
          }}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        {/* @ts-ignore - Carousel props types */}
        <Carousel
          ref={carouselRef}
          data={surahs}
          renderItem={renderCard}
          sliderWidth={SCREEN_WIDTH}
          itemWidth={SCREEN_WIDTH * 0.9}
          inactiveSlideScale={0.9}
          inactiveSlideOpacity={0.6}
          onSnapToItem={handleSnapToItem}
        />
      </View>

      {/* Page indicators */}
      <PageIndicators total={surahs.length} activeIndex={currentIndex} />

      {/* Start Recording button */}
      <StartRecordingButton
        onPress={() => onStartRecording(surahs[currentIndex])}
        onShowAyahSelector={() => {
          // TODO: Show ayah selector modal
          Alert.alert('Ayah Selector', 'Coming soon!');
        }}
      />

      {/* Modals */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleSearchSelect}
      />

      <FavoritesModal
        visible={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelect={handleFavoritesSelect}
      />

      {/* Heart animation */}
      <HeartAnimation
        trigger={showHeartAnimation}
        onComplete={() => setShowHeartAnimation(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
