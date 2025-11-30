import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Surah } from '../lib/surahStore';

interface EnhancementStudioProps {
  surah: Surah;
  recordingUri: string;
  duration: number;
  onComplete: (enhancementType: EnhancementType) => void;
  onCancel: () => void;
}

export type EnhancementType = 'clean' | 'studio' | 'mosque_light' | 'mosque_deep';

interface EnhancementOption {
  id: EnhancementType;
  name: string;
  description: string;
  icon: string;
}

const ENHANCEMENT_OPTIONS: EnhancementOption[] = [
  {
    id: 'clean',
    name: 'Clean',
    description: 'Noise reduction only',
    icon: 'sparkles-outline'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Professional clarity + compression',
    icon: 'mic-outline'
  },
  {
    id: 'mosque_light',
    name: 'Mosque Light',
    description: 'Studio + subtle room reverb',
    icon: 'business-outline'
  },
  {
    id: 'mosque_deep',
    name: 'Mosque Deep',
    description: 'Studio + deep mosque reverb',
    icon: 'moon-outline'
  }
];

export function EnhancementStudio({ 
  surah, 
  recordingUri, 
  duration, 
  onComplete, 
  onCancel 
}: EnhancementStudioProps) {
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType>('studio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to play recording', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEnhancementSelect = (type: EnhancementType) => {
    setSelectedEnhancement(type);
    Haptics.selectionAsync();
  };

  const handleUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(selectedEnhancement);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Enhancement</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Surah Info */}
      <View style={styles.surahInfo}>
        <Text style={styles.surahNumber}>Surah {surah.number}</Text>
        <Text style={styles.surahName}>{surah.name.transliteration}</Text>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      {/* Preview Player */}
      <View style={styles.playerContainer}>
        <Text style={styles.sectionTitle}>Preview Recording</Text>
        <TouchableOpacity 
          onPress={isPlaying ? stopPlayback : playRecording}
          style={styles.playButton}
        >
          <LinearGradient 
            colors={isPlaying ? ['#DC2626', '#EF4444'] : ['#059669', '#10B981']} 
            style={styles.playGradient}
          >
            <Ionicons 
              name={isPlaying ? 'stop' : 'play'} 
              size={32} 
              color="#FFFFFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Enhancement Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Enhancement Type</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the audio processing that best suits your recording environment
        </Text>

        <View style={styles.options}>
          {ENHANCEMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedEnhancement === option.id && styles.optionCardSelected
              ]}
              onPress={() => handleEnhancementSelect(option.id)}
            >
              <View style={styles.optionHeader}>
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={selectedEnhancement === option.id ? '#059669' : '#6B7280'} 
                />
                <View style={styles.optionTexts}>
                  <Text style={[
                    styles.optionName,
                    selectedEnhancement === option.id && styles.optionNameSelected
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              {selectedEnhancement === option.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#059669" />
        <Text style={styles.infoText}>
          All enhancements preserve the integrity of your recitation. No musical effects or pitch alteration.
        </Text>
      </View>

      {/* Upload Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleUpload}
          style={styles.uploadButton}
          disabled={isLoading}
        >
          <LinearGradient colors={['#059669', '#10B981']} style={styles.uploadGradient}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
                <Text style={styles.uploadText}>Upload Recitation</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  surahInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  surahNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  surahName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  duration: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  playerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  playGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTexts: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionNameSelected: {
    color: '#059669',
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkmark: {
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  uploadButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
