import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PageIndicatorsProps {
  total: number;
  activeIndex: number;
}

/**
 * Page indicators showing position in carousel (1-114)
 * Shows 7 dots centered around current position
 */
export function PageIndicators({ total, activeIndex }: PageIndicatorsProps) {
  const visibleDots = 7;
  const halfVisible = Math.floor(visibleDots / 2);

  const getDotsRange = () => {
    let start = activeIndex - halfVisible;
    let end = activeIndex + halfVisible;

    if (start < 0) {
      start = 0;
      end = Math.min(visibleDots - 1, total - 1);
    }
    if (end >= total) {
      end = total - 1;
      start = Math.max(0, total - visibleDots);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <View style={styles.container}>
      {getDotsRange().map((index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#1B5E3F',
  },
});
