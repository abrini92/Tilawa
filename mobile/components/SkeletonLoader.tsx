import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function RecitationCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
        </View>
        <View style={styles.headerInfo}>
          <SkeletonLoader width="60%" height={16} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="40%" height={14} />
        </View>
      </View>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        <SkeletonLoader width="100%" height={50} borderRadius={8} />
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <SkeletonLoader width={60} height={14} style={{ marginRight: 12 }} />
          <SkeletonLoader width={60} height={14} />
        </View>
        <SkeletonLoader width={80} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      {/* Avatar */}
      <View style={styles.profileHeader}>
        <SkeletonLoader width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
        <SkeletonLoader width={150} height={24} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={200} height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={180} height={14} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <SkeletonLoader width={40} height={24} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={80} height={14} />
        </View>
        <View style={styles.statItem}>
          <SkeletonLoader width={40} height={24} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={80} height={14} />
        </View>
        <View style={styles.statItem}>
          <SkeletonLoader width={40} height={24} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  waveformContainer: {
    paddingVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stats: {
    flexDirection: 'row',
  },
  profileContainer: {
    backgroundColor: '#fff',
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
});
