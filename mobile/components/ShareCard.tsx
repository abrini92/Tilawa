import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedWaveform from './AnimatedWaveform';

interface ShareCardProps {
  reciterName: string;
  surahName: string;
  surahNumber: number;
  duration?: string;
  plays?: number;
}

export async function generateShareCard({
  reciterName,
  surahName,
  surahNumber,
  duration,
  plays,
}: ShareCardProps) {
  // This would be rendered off-screen and captured
  // For now, we'll use the native share with text
  const shareText = `🎙️ ${reciterName} reciting ${surahName}\n\n📖 Surah ${surahNumber}\n${duration ? `⏱️ ${duration}` : ''}\n${plays ? `👁️ ${plays.toLocaleString()} plays` : ''}\n\nListen on Tilawa - Preserving the Art of Quranic Recitation\n\n#Tilawa #QuranRecitation #${surahName.replace(/\s+/g, '')}`;
  
  return shareText;
}

export function ShareCardPreview({
  reciterName,
  surahName,
  surahNumber,
  duration,
  plays,
}: ShareCardProps) {
  const viewRef = useRef(null);

  return (
    <View ref={viewRef} style={styles.card}>
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Branding */}
        <View style={styles.header}>
          <Text style={styles.logo}>🕋 TILAWA</Text>
          <Text style={styles.tagline}>Preserving Sacred Recitation</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Reciter */}
          <View style={styles.reciterContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{reciterName.charAt(0)}</Text>
            </View>
            <Text style={styles.reciterName}>{reciterName}</Text>
          </View>

          {/* Surah Info */}
          <View style={styles.surahInfo}>
            <Text style={styles.surahNumber}>#{surahNumber}</Text>
            <Text style={styles.surahName}>{surahName}</Text>
          </View>

          {/* Waveform */}
          <View style={styles.waveformContainer}>
            <AnimatedWaveform
              isPlaying={false}
              barCount={30}
              height={60}
              color="rgba(255, 255, 255, 0.8)"
            />
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {duration && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statText}>{duration}</Text>
              </View>
            )}
            {plays && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>👁️</Text>
                <Text style={styles.statText}>{plays.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Listen on Tilawa App
          </Text>
          <Text style={styles.footerSubtext}>
            90% Mission • 10% Business
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 400,
    height: 600,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  gradient: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciterContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  reciterName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  surahInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  surahNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  surahName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  waveformContainer: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});
