import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface WaveformProps {
  bars?: number;
  height?: number;
  color?: string;
  animated?: boolean;
}

export default function Waveform({ 
  bars = 40, 
  height = 60, 
  color = '#10b981',
  animated = false 
}: WaveformProps) {
  // ✅ MEMOIZED - Only recalculate when bars change
  const barHeights = useMemo(() => 
    Array.from({ length: bars }, () => 
      Math.random() * 0.7 + 0.3 // Between 30% and 100%
    ),
    [bars]
  );

  const barWidth = 2;
  const barGap = 2;
  const totalWidth = bars * (barWidth + barGap);

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={totalWidth} height={height}>
        {barHeights.map((heightRatio, index) => {
          const barHeight = height * heightRatio;
          const x = index * (barWidth + barGap);
          const y = (height - barHeight) / 2;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.8}
              rx={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
