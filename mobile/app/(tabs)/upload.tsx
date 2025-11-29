import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { apiClient } from '../../lib/api-client';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import SearchBar from '../../components/SearchBar';
import Analytics from '../../lib/analytics';
import * as FileSystem from 'expo-file-system';
import RNBlobUtil from 'react-native-blob-util';

interface Surah {
  number: number;
  name: string;
  arabicName: string;
  verses: number;
}

interface Verse {
  number: number;
  arabic: string;
  translation?: string;
}

export default function Upload() {
  const [step, setStep] = useState<'select' | 'record' | 'preview'>('select');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verseRange, setVerseRange] = useState({ from: 1, to: 1 });
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const scrollViewRef = useState<ScrollView | null>(null)[0];
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Load verses when surah is selected
  useEffect(() => {
    if (selectedSurah && step === 'record') {
      loadVerses(selectedSurah.number);
    }
  }, [selectedSurah, step]);

  const loadVerses = async (surahNumber: number) => {
    setLoadingVerses(true);
    try {
      // Using Al-Quran Cloud API - Arabic text (Uthmani script)
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`
      );
      const data = await response.json();
      
      if (data.code === 200 && data.data.ayahs) {
        const loadedVerses: Verse[] = data.data.ayahs.map((ayah: any) => ({
          number: ayah.numberInSurah,
          arabic: ayah.text,
        }));
        setVerses(loadedVerses);
      }
    } catch (error) {
      console.error('Failed to load verses:', error);
      Alert.alert('Error', 'Failed to load Quran verses. Using offline mode.');
      // Fallback to mock data
      setVerses([
        { number: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
      ]);
    } finally {
      setLoadingVerses(false);
    }
  };

  // All 114 Surahs of the Quran - Official data from Mushaf
  const allSurahs: Surah[] = [
    { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', verses: 7 },
    { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', verses: 286 },
    { number: 3, name: 'Aal-i-Imran', arabicName: 'آل عمران', verses: 200 },
    { number: 4, name: 'An-Nisa', arabicName: 'النساء', verses: 176 },
    { number: 5, name: 'Al-Ma\'idah', arabicName: 'المائدة', verses: 120 },
    { number: 6, name: 'Al-An\'am', arabicName: 'الأنعام', verses: 165 },
    { number: 7, name: 'Al-A\'raf', arabicName: 'الأعراف', verses: 206 },
    { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', verses: 75 },
    { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', verses: 129 },
    { number: 10, name: 'Yunus', arabicName: 'يونس', verses: 109 },
    { number: 11, name: 'Hud', arabicName: 'هود', verses: 123 },
    { number: 12, name: 'Yusuf', arabicName: 'يوسف', verses: 111 },
    { number: 13, name: 'Ar-Ra\'d', arabicName: 'الرعد', verses: 43 },
    { number: 14, name: 'Ibrahim', arabicName: 'ابراهيم', verses: 52 },
    { number: 15, name: 'Al-Hijr', arabicName: 'الحجر', verses: 99 },
    { number: 16, name: 'An-Nahl', arabicName: 'النحل', verses: 128 },
    { number: 17, name: 'Al-Isra', arabicName: 'الإسراء', verses: 111 },
    { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', verses: 110 },
    { number: 19, name: 'Maryam', arabicName: 'مريم', verses: 98 },
    { number: 20, name: 'Taha', arabicName: 'طه', verses: 135 },
    { number: 21, name: 'Al-Anbya', arabicName: 'الأنبياء', verses: 112 },
    { number: 22, name: 'Al-Hajj', arabicName: 'الحج', verses: 78 },
    { number: 23, name: 'Al-Mu\'minun', arabicName: 'المؤمنون', verses: 118 },
    { number: 24, name: 'An-Nur', arabicName: 'النور', verses: 64 },
    { number: 25, name: 'Al-Furqan', arabicName: 'الفرقان', verses: 77 },
    { number: 26, name: 'Ash-Shu\'ara', arabicName: 'الشعراء', verses: 227 },
    { number: 27, name: 'An-Naml', arabicName: 'النمل', verses: 93 },
    { number: 28, name: 'Al-Qasas', arabicName: 'القصص', verses: 88 },
    { number: 29, name: 'Al-\'Ankabut', arabicName: 'العنكبوت', verses: 69 },
    { number: 30, name: 'Ar-Rum', arabicName: 'الروم', verses: 60 },
    { number: 31, name: 'Luqman', arabicName: 'لقمان', verses: 34 },
    { number: 32, name: 'As-Sajdah', arabicName: 'السجدة', verses: 30 },
    { number: 33, name: 'Al-Ahzab', arabicName: 'الأحزاب', verses: 73 },
    { number: 34, name: 'Saba', arabicName: 'سبإ', verses: 54 },
    { number: 35, name: 'Fatir', arabicName: 'فاطر', verses: 45 },
    { number: 36, name: 'Ya-Sin', arabicName: 'يس', verses: 83 },
    { number: 37, name: 'As-Saffat', arabicName: 'الصافات', verses: 182 },
    { number: 38, name: 'Sad', arabicName: 'ص', verses: 88 },
    { number: 39, name: 'Az-Zumar', arabicName: 'الزمر', verses: 75 },
    { number: 40, name: 'Ghafir', arabicName: 'غافر', verses: 85 },
    { number: 41, name: 'Fussilat', arabicName: 'فصلت', verses: 54 },
    { number: 42, name: 'Ash-Shuraa', arabicName: 'الشورى', verses: 53 },
    { number: 43, name: 'Az-Zukhruf', arabicName: 'الزخرف', verses: 89 },
    { number: 44, name: 'Ad-Dukhan', arabicName: 'الدخان', verses: 59 },
    { number: 45, name: 'Al-Jathiyah', arabicName: 'الجاثية', verses: 37 },
    { number: 46, name: 'Al-Ahqaf', arabicName: 'الأحقاف', verses: 35 },
    { number: 47, name: 'Muhammad', arabicName: 'محمد', verses: 38 },
    { number: 48, name: 'Al-Fath', arabicName: 'الفتح', verses: 29 },
    { number: 49, name: 'Al-Hujurat', arabicName: 'الحجرات', verses: 18 },
    { number: 50, name: 'Qaf', arabicName: 'ق', verses: 45 },
    { number: 51, name: 'Adh-Dhariyat', arabicName: 'الذاريات', verses: 60 },
    { number: 52, name: 'At-Tur', arabicName: 'الطور', verses: 49 },
    { number: 53, name: 'An-Najm', arabicName: 'النجم', verses: 62 },
    { number: 54, name: 'Al-Qamar', arabicName: 'القمر', verses: 55 },
    { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', verses: 78 },
    { number: 56, name: 'Al-Waqi\'ah', arabicName: 'الواقعة', verses: 96 },
    { number: 57, name: 'Al-Hadid', arabicName: 'الحديد', verses: 29 },
    { number: 58, name: 'Al-Mujadila', arabicName: 'المجادلة', verses: 22 },
    { number: 59, name: 'Al-Hashr', arabicName: 'الحشر', verses: 24 },
    { number: 60, name: 'Al-Mumtahanah', arabicName: 'الممتحنة', verses: 13 },
    { number: 61, name: 'As-Saf', arabicName: 'الصف', verses: 14 },
    { number: 62, name: 'Al-Jumu\'ah', arabicName: 'الجمعة', verses: 11 },
    { number: 63, name: 'Al-Munafiqun', arabicName: 'المنافقون', verses: 11 },
    { number: 64, name: 'At-Taghabun', arabicName: 'التغابن', verses: 18 },
    { number: 65, name: 'At-Talaq', arabicName: 'الطلاق', verses: 12 },
    { number: 66, name: 'At-Tahrim', arabicName: 'التحريم', verses: 12 },
    { number: 67, name: 'Al-Mulk', arabicName: 'الملك', verses: 30 },
    { number: 68, name: 'Al-Qalam', arabicName: 'القلم', verses: 52 },
    { number: 69, name: 'Al-Haqqah', arabicName: 'الحاقة', verses: 52 },
    { number: 70, name: 'Al-Ma\'arij', arabicName: 'المعارج', verses: 44 },
    { number: 71, name: 'Nuh', arabicName: 'نوح', verses: 28 },
    { number: 72, name: 'Al-Jinn', arabicName: 'الجن', verses: 28 },
    { number: 73, name: 'Al-Muzzammil', arabicName: 'المزمل', verses: 20 },
    { number: 74, name: 'Al-Muddaththir', arabicName: 'المدثر', verses: 56 },
    { number: 75, name: 'Al-Qiyamah', arabicName: 'القيامة', verses: 40 },
    { number: 76, name: 'Al-Insan', arabicName: 'الانسان', verses: 31 },
    { number: 77, name: 'Al-Mursalat', arabicName: 'المرسلات', verses: 50 },
    { number: 78, name: 'An-Naba', arabicName: 'النبإ', verses: 40 },
    { number: 79, name: 'An-Nazi\'at', arabicName: 'النازعات', verses: 46 },
    { number: 80, name: '\'Abasa', arabicName: 'عبس', verses: 42 },
    { number: 81, name: 'At-Takwir', arabicName: 'التكوير', verses: 29 },
    { number: 82, name: 'Al-Infitar', arabicName: 'الإنفطار', verses: 19 },
    { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', verses: 36 },
    { number: 84, name: 'Al-Inshiqaq', arabicName: 'الإنشقاق', verses: 25 },
    { number: 85, name: 'Al-Buruj', arabicName: 'البروج', verses: 22 },
    { number: 86, name: 'At-Tariq', arabicName: 'الطارق', verses: 17 },
    { number: 87, name: 'Al-A\'la', arabicName: 'الأعلى', verses: 19 },
    { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', verses: 26 },
    { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', verses: 30 },
    { number: 90, name: 'Al-Balad', arabicName: 'البلد', verses: 20 },
    { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', verses: 15 },
    { number: 92, name: 'Al-Layl', arabicName: 'الليل', verses: 21 },
    { number: 93, name: 'Ad-Duhaa', arabicName: 'الضحى', verses: 11 },
    { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', verses: 8 },
    { number: 95, name: 'At-Tin', arabicName: 'التين', verses: 8 },
    { number: 96, name: 'Al-\'Alaq', arabicName: 'العلق', verses: 19 },
    { number: 97, name: 'Al-Qadr', arabicName: 'القدر', verses: 5 },
    { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', verses: 8 },
    { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', verses: 8 },
    { number: 100, name: 'Al-\'Adiyat', arabicName: 'العاديات', verses: 11 },
    { number: 101, name: 'Al-Qari\'ah', arabicName: 'القارعة', verses: 11 },
    { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', verses: 8 },
    { number: 103, name: 'Al-\'Asr', arabicName: 'العصر', verses: 3 },
    { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', verses: 9 },
    { number: 105, name: 'Al-Fil', arabicName: 'الفيل', verses: 5 },
    { number: 106, name: 'Quraysh', arabicName: 'قريش', verses: 4 },
    { number: 107, name: 'Al-Ma\'un', arabicName: 'الماعون', verses: 7 },
    { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', verses: 3 },
    { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', verses: 6 },
    { number: 110, name: 'An-Nasr', arabicName: 'النصر', verses: 3 },
    { number: 111, name: 'Al-Masad', arabicName: 'المسد', verses: 5 },
    { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', verses: 4 },
    { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', verses: 5 },
    { number: 114, name: 'An-Nas', arabicName: 'الناس', verses: 6 },
  ];

  const startRecording = async () => {
    try {
      // Haptic feedback on start
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setCurrentVerse(1);
      setRecordingDuration(0);

      // Auto-advance verses every 15 seconds (simulate)
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
        setCurrentVerse(prev => {
          const totalVerses = selectedSurah?.verses || 7;
          return prev < totalVerses ? prev + 1 : prev;
        });
      }, 15000);

      // Store interval ID to clear later
      (recording as any).verseInterval = interval;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    // Haptic feedback on stop
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Clear verse interval
    if ((recording as any).verseInterval) {
      clearInterval((recording as any).verseInterval);
    }

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordingUri(uri);
    setRecording(null);
    setStep('preview');
  };

  const uploadRecording = async () => {
    if (!recordingUri || !selectedSurah) {
      Alert.alert('Error', 'No recording to upload');
      return;
    }

    setUploading(true);
    try {
      // Get user from auth context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please sign in to upload');
        return;
      }

      // Create file name
      const fileName = `${user.id}/${Date.now()}_surah_${selectedSurah.number}.m4a`;
      
      console.log('Recording URI:', recordingUri);
      
      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }

      const fileSize = fileInfo.size || 0;
      console.log('File size:', fileSize);
      
      if (fileSize === 0) {
        throw new Error('Recording file is empty');
      }

      // Upload via backend API (works on Expo Go!)
      console.log('Uploading via backend API...');
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: recordingUri,
        type: 'audio/m4a',
        name: `surah_${selectedSurah.number}.m4a`,
      } as any);
      formData.append('userId', user.id);
      formData.append('surahNumber', selectedSurah.number.toString());
      formData.append('surahName', selectedSurah.name);
      formData.append('verseFrom', verseRange.from.toString());
      formData.append('verseTo', verseRange.to.toString());

      // Upload to backend API
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload success:', uploadData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Analytics.uploadRecording(selectedSurah.number, fileSize);
      
      Alert.alert('Success', 'Your recitation has been uploaded! 🎉', [
        {
          text: 'OK',
          onPress: () => {
            setStep('select');
            setSelectedSurah(null);
            setRecordingUri(null);
          },
        },
      ]);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const renderSurahSelection = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Recitation</Text>
        <Text style={styles.subtitle}>Choose a Surah to recite</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          surahs={allSurahs}
          onSelect={(surah) => {
            setSelectedSurah(surah);
            setVerseRange({ from: 1, to: surah.verses });
            setStep('record');
            Analytics.search(surah.name, 1);
          }}
          placeholder="Search by name, number, or Arabic..."
        />
      </View>

      <View style={styles.surahList}>
        {allSurahs.map((surah) => (
          <TouchableOpacity
            key={surah.number}
            style={styles.surahCard}
            onPress={() => {
              setSelectedSurah(surah);
              setVerseRange({ from: 1, to: surah.verses });
              setStep('record');
            }}
          >
            <View style={styles.surahNumber}>
              <Text style={styles.surahNumberText}>{surah.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <Text style={styles.surahName}>{surah.name}</Text>
              <Text style={styles.surahArabic}>{surah.arabicName}</Text>
            </View>
            <Text style={styles.versesCount}>{surah.verses} verses</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderRecording = () => {
    if (loadingVerses) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading verses...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.headerCompact}>
          <TouchableOpacity onPress={() => setStep('select')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.titleCompact}>{selectedSurah?.name}</Text>
            <Text style={styles.subtitleCompact}>{selectedSurah?.arabicName}</Text>
          </View>
        </View>

        {/* Verses Scrolling Area */}
        <ScrollView 
          ref={(ref) => (scrollViewRef as any) = ref}
          style={styles.versesContainer}
          contentContainerStyle={styles.versesContent}
          showsVerticalScrollIndicator={false}
        >
          {verses.map((verse) => {
            const isCurrentVerse = isRecording && verse.number === currentVerse;
            return (
              <View 
                key={verse.number} 
                style={[
                  styles.verseCard,
                  isCurrentVerse && styles.verseCardActive
                ]}
              >
                <View style={[
                  styles.verseNumber,
                  isCurrentVerse && styles.verseNumberActive
                ]}>
                  <Text style={[
                    styles.verseNumberText,
                    isCurrentVerse && styles.verseNumberTextActive
                  ]}>
                    {verse.number}
                  </Text>
                </View>
                <Text style={[
                  styles.verseArabic,
                  isCurrentVerse && styles.verseArabicActive
                ]}>
                  {verse.arabic}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Recording Controls */}
        <View style={styles.recordingControls}>
          <TouchableOpacity
            style={[styles.recordButtonLarge, isRecording && styles.recordButtonRecording]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={[styles.recordDotLarge, isRecording && styles.recordDotRecording]} />
          </TouchableOpacity>
          
          <Text style={styles.recordingStatusCompact}>
            {isRecording ? 'Recording...' : 'Tap to start'}
          </Text>
        </View>
      </View>
    );
  };

  const renderPreview = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preview</Text>
        <Text style={styles.subtitle}>Listen before uploading</Text>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>{selectedSurah?.name}</Text>
        <Text style={styles.previewSubtitle}>
          Verses {verseRange.from}-{verseRange.to}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retakeButton]}
          onPress={() => {
            setRecordingUri(null);
            setStep('record');
          }}
        >
          <Text style={styles.actionButtonText}>🔄 Re-record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.uploadButtonGreen, uploading && styles.buttonDisabled]}
          onPress={uploadRecording}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>✓ Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (step === 'record') return renderRecording();
  if (step === 'preview') return renderPreview();
  return renderSurahSelection();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  surahList: {
    padding: 16,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  surahNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  surahArabic: {
    fontSize: 15,
    color: '#64748b',
  },
  versesCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  waveform: {
    marginBottom: 40,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
  },
  recordDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
  },
  recordDotActive: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  recordingStatus: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 32,
  },
  controlButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  controlButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  tipsBox: {
    backgroundColor: '#ecfdf5',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 22,
  },
  previewCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retakeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  uploadButtonGreen: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  titleCompact: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitleCompact: {
    fontSize: 14,
    color: '#64748b',
  },
  versesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  versesContent: {
    padding: 20,
  },
  verseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  verseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  verseNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  verseArabic: {
    flex: 1,
    fontSize: 22,
    lineHeight: 40,
    color: '#0f172a',
    textAlign: 'right',
    fontWeight: '500',
  },
  recordingControls: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  recordButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  recordButtonRecording: {
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
  },
  recordDotLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
  },
  recordDotRecording: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  recordingStatusCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  verseCardActive: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    paddingLeft: 12,
  },
  verseNumberActive: {
    backgroundColor: '#10b981',
  },
  verseNumberTextActive: {
    color: '#fff',
  },
  verseArabicActive: {
    color: '#059669',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 1000,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});
