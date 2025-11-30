import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface AnimatedWaveformProps {
  isPlaying?: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export default function AnimatedWaveform({ 
  isPlaying = false, 
  color = '#10b981',
  barCount = 40,
  height = 60
}: AnimatedWaveformProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      // Start animations for all bars
      const animationSequences = animations.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 300 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.4,
              duration: 300 + Math.random() * 400,
              useNativeDriver: true,
            }),
          ])
        );
      });

      // Start all animations with slight delays
      animationSequences.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 20);
      });

      return () => {
        animationSequences.forEach(anim => anim.stop());
      };
    } else {
      // Reset to static state
      animations.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={[styles.container, { height }]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [
                {
                  scaleY: anim,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  bar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
