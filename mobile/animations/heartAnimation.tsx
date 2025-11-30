import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeartAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function HeartAnimation({ trigger, onComplete }: HeartAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 700);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Ionicons name="heart" size={80} color="#E53E3E" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 1000,
  },
});
