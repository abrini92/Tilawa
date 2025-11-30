import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { Surah } from '../lib/surahStore';

interface RecordingScreenProps {
  surah: Surah;
  onComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export function RecordingScreen({ surah, onComplete, onCancel }: RecordingScreenProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
      }
    })();
  }, []);

  // Timer for duration
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 15 minutes (900 seconds)
          if (newDuration >= 900) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        await requestPermission();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setStatus('recording');
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;

    try {
      await recording.pauseAsync();
      setStatus('paused');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Failed to pause recording', err);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;

    try {
      await recording.startAsync();
      setStatus('recording');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setStatus('stopped');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (uri) {
        onComplete(uri, duration);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (err) {
        console.error('Failed to cancel recording', err);
      }
    }
    setRecording(null);
    setStatus('idle');
    setDuration(0);
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Recording</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Surah Info */}
      <View style={styles.surahInfo}>
        <Text style={styles.surahNumber}>Surah {surah.number}</Text>
        <Text style={styles.surahName}>{surah.name.transliteration}</Text>
        <Text style={styles.surahArabic}>{surah.name.arabic}</Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
        <Text style={styles.timerLabel}>
          {status === 'recording' ? 'Recording...' : status === 'paused' ? 'Paused' : 'Ready'}
        </Text>
      </View>

      {/* Recording Indicator */}
      {status === 'recording' && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'idle' && (
          <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
            <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.recordGradient}>
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {status === 'recording' && (
          <View style={styles.recordingControls}>
            <TouchableOpacity onPress={pauseRecording} style={styles.controlButton}>
              <Ionicons name="pause" size={28} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          </View>
        )}

        {status === 'paused' && (
          <View style={styles.recordingControls}>
            <TouchableOpacity onPress={resumeRecording} style={styles.controlButton}>
              <Ionicons name="play" size={28} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tips}>
        <Text style={styles.tipText}>💡 Maximum duration: 15 minutes</Text>
        <Text style={styles.tipText}>🎙️ Speak clearly and close to the microphone</Text>
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
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  surahInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  surahNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  surahName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  surahArabic: {
    fontSize: 32,
    color: '#059669',
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    color: '#1F2937',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#DC2626',
    borderRadius: 4,
  },
  tips: {
    paddingHorizontal: 32,
    paddingTop: 20,
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
