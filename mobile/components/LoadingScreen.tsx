import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  message?: string;
}

// Collection of inspiring Quranic verses
const DAILY_VERSES = [
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease',
    reference: 'Surah Ash-Sharh (94:6)',
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    translation: 'Remember Me, I will remember you',
    reference: 'Surah Al-Baqarah (2:152)',
  },
  {
    arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    translation: 'And say: My Lord, increase me in knowledge',
    reference: 'Surah Ta-Ha (20:114)',
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Indeed, Allah is with the patient',
    reference: 'Surah Al-Baqarah (2:153)',
  },
  {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'Whoever fears Allah, He will make a way out',
    reference: 'Surah At-Talaq (65:2)',
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً',
    translation: 'Our Lord, give us good in this world',
    reference: 'Surah Al-Baqarah (2:201)',
  },
];

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [dailyVerse] = useState(() => {
    // Select a random verse
    return DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Icon with gradient background */}
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
          style={styles.iconContainer}
        >
          <Text style={styles.icon}>🕋</Text>
        </LinearGradient>

        {/* Daily Verse */}
        <View style={styles.verseContainer}>
          <Text style={styles.verseArabic}>{dailyVerse.arabic}</Text>
          <Text style={styles.verseTranslation}>{dailyVerse.translation}</Text>
          <Text style={styles.verseReference}>{dailyVerse.reference}</Text>
        </View>

        {/* Spinner */}
        <ActivityIndicator size="large" color="#10b981" style={styles.spinner} />

        {/* Loading message */}
        <Text style={styles.loadingMessage}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 56,
  },
  verseContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  verseArabic: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    fontFamily: 'System',
  },
  verseTranslation: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 24,
  },
  verseReference: {
    fontSize: 13,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '600',
  },
  spinner: {
    marginTop: 24,
    marginBottom: 12,
  },
  loadingMessage: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
