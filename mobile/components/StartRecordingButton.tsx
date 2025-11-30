import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StartRecordingButtonProps {
  onPress: () => void;
  onShowAyahSelector?: () => void;
}

export function StartRecordingButton({ onPress, onShowAyahSelector }: StartRecordingButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const handleAdvancedPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowAyahSelector?.();
  };

  return (
    <View style={styles.container}>
      {/* Advanced option (small) */}
      {onShowAyahSelector && (
        <TouchableOpacity onPress={handleAdvancedPress}>
          <Text style={styles.advancedOption}>⚙️ Select specific ayat</Text>
        </TouchableOpacity>
      )}

      {/* Main CTA (large) */}
      <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient colors={['#1B5E3F', '#236B4A']} style={styles.gradient}>
          <Ionicons name="mic" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Start Recording</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  advancedOption: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    textAlign: 'center',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
