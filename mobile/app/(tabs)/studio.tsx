import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SurahCarouselScreen } from '../../screens/SurahCarouselScreen';
import { RecordingScreen } from '../../screens/RecordingScreen';
import { EnhancementStudio, type EnhancementType } from '../../screens/EnhancementStudio';
import { uploadAudio } from '../../lib/upload';
import type { Surah } from '../../lib/surahStore';

type StudioStep = 'select' | 'recording' | 'enhancement' | 'uploading';

export default function Studio() {
  const [step, setStep] = useState<StudioStep>('select');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const router = useRouter();

  const handleStartRecording = (surah: Surah) => {
    setSelectedSurah(surah);
    setStep('recording');
  };

  const handleUpload = async (uri: string, duration: number, surah: Surah, enhancement: EnhancementType) => {
    setStep('uploading');
    
    try {
      const result = await uploadAudio(
        uri,
        surah.number,
        surah.name.transliteration,
        duration,
        enhancement
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your recitation has been uploaded successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedSurah(null);
                setRecordingUri(null);
                setStep('select');
                // Navigate to feed to see the new recitation
                router.push('/(tabs)');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Upload Failed',
          result.error || 'Something went wrong. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => handleUpload(uri, duration, surah, 'studio')
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setSelectedSurah(null);
                setRecordingUri(null);
                setStep('select');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedSurah(null);
              setRecordingUri(null);
              setStep('select');
            }
          }
        ]
      );
    } finally {
      // Upload complete
    }
  };

  const handleRecordingComplete = (uri: string, duration: number) => {
    setRecordingUri(uri);
    setRecordingDuration(duration);
    setStep('enhancement');
  };

  const handleRecordingCancel = () => {
    setSelectedSurah(null);
    setRecordingUri(null);
    setStep('select');
  };

  const handleEnhancementComplete = (enhancement: EnhancementType) => {
    if (!selectedSurah || !recordingUri) return;
    handleUpload(recordingUri, recordingDuration, selectedSurah, enhancement);
  };

  const handleEnhancementCancel = () => {
    setStep('recording');
  };

  // Uploading step
  if (step === 'uploading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.uploadingText}>Uploading your recitation...</Text>
      </View>
    );
  }

  // Enhancement step
  if (step === 'enhancement' && selectedSurah && recordingUri) {
    return (
      <EnhancementStudio
        surah={selectedSurah}
        recordingUri={recordingUri}
        duration={recordingDuration}
        onComplete={handleEnhancementComplete}
        onCancel={handleEnhancementCancel}
      />
    );
  }

  // Recording step
  if (step === 'recording' && selectedSurah) {
    return (
      <RecordingScreen
        surah={selectedSurah}
        onComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SurahCarouselScreen onStartRecording={handleStartRecording} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
});
