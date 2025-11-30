import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface IslamicPatternProps {
  opacity?: number;
  color?: string;
}

/**
 * Islamic 8-pointed star pattern
 * Subtle decorative element for Surah cards
 */
export function IslamicPattern({ opacity = 0.05, color = '#1B5E3F' }: IslamicPatternProps) {
  return (
    <Svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={[styles.pattern, { opacity }]}
    >
      <G transform="translate(100, 100)">
        {/* 8-pointed star */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
          <Path
            key={index}
            d="M 0,-60 L 15,-15 L 60,0 L 15,15 L 0,60 L -15,15 L -60,0 L -15,-15 Z"
            fill={color}
            transform={`rotate(${angle})`}
          />
        ))}
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  pattern: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
});
