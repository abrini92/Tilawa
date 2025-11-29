import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, RefreshControl, TextInput } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import AudioPlayer from '../../components/AudioPlayer';
import Waveform from '../../components/Waveform';
import LikeButton from '../../components/LikeButton';
import { RecitationCardSkeleton } from '../../components/SkeletonLoader';
import * as Haptics from 'expo-haptics';
import { getSurahAudio, AVAILABLE_RECITERS } from '../../lib/quran-audio-service';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { shareRecitation } from '../../lib/share';

interface Recitation {
  id: string;
  reciter_name: string;
  reciter_avatar?: string;
  surah_name: string;
  surah_number: number;
  duration: string;
  plays: number;
  likes?: number;
  audio_url?: string;
  created_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use global store
  const { 
    recitations, 
    feedLoading: loading,
    setRecitations,
    setFeedLoading,
    setCurrentRecitation,
    incrementPlays
  } = useAppStore();

  useEffect(() => {
    loadRecitations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecitations();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Filter recitations based on search query
  const filteredRecitations = useMemo(() => {
    if (!searchQuery.trim()) return recitations;
    
    const query = searchQuery.toLowerCase();
    return recitations.filter(rec => 
      rec.surah_name.toLowerCase().includes(query) ||
      rec.reciter_name.toLowerCase().includes(query) ||
      rec.surah_number.toString().includes(query)
    );
  }, [recitations, searchQuery]);

  const loadRecitations = async () => {
    try {
      // ✅ LOAD REAL USER RECITATIONS FROM SUPABASE
      // Charger les récitations d'abord
      const { data: userRecitations, error: recitationsError } = await supabase
        .from('recitations')
        .select('*')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(20);

      if (recitationsError) throw recitationsError;

      // Si on a des récitations, charger les profils séparément
      if (userRecitations && userRecitations.length > 0) {
        // Récupérer les IDs uniques des users
        const userIds = [...new Set(userRecitations.map(r => r.user_id))];
        
        // Charger les profils
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.warn('Could not load profiles:', profilesError);
        }

        // Créer un map des profils
        const profilesMap = new Map(
          (profiles || []).map(p => [p.id, p])
        );

        // Formatter les récitations avec les profils
        const formattedRecitations: Recitation[] = userRecitations.map((rec: any) => {
          const profile = profilesMap.get(rec.user_id);
          return {
            id: rec.id,
            reciter_name: profile?.full_name || profile?.email || 'Anonymous',
            reciter_avatar: profile?.avatar_url,
            surah_name: rec.surah_name,
            surah_number: rec.surah_number,
            duration: formatDuration(rec.duration),
            plays: rec.plays || 0,
            likes: rec.likes || 0,
            audio_url: rec.audio_url,
            created_at: rec.created_at,
          };
        });

        setRecitations(formattedRecitations);
        return;
      }

      // FALLBACK: If no user recitations, load from Quran API
      console.log('No user recitations found, loading from Quran API...');
      
      const popularSurahs = [
        { number: 1, name: 'Al-Fatihah' },
        { number: 36, name: 'Ya-Sin' },
        { number: 55, name: 'Ar-Rahman' },
      ];

      const surahPromises = popularSurahs.map(surah =>
        getSurahAudio(surah.number, 'ar.alafasy')
          .then(surahAudio => ({ surah, surahAudio }))
          .catch(error => {
            console.error(`Failed to load ${surah.name}:`, error);
            return null;
          })
      );

      const results = await Promise.all(surahPromises);
      
      const recitationsData: Recitation[] = results
        .filter((result): result is NonNullable<typeof result> => 
          result !== null && result.surahAudio !== null
        )
        .map(({ surah, surahAudio }) => ({
          id: `demo-${surah.number}`,
          reciter_name: 'Mishary Rashid Al-Afasy',
          surah_name: surah.name,
          surah_number: surah.number,
          duration: calculateDuration(surahAudio!.verses.length),
          plays: Math.floor(Math.random() * 5000) + 1000,
          likes: Math.floor(Math.random() * 500) + 100,
          audio_url: surahAudio!.verses[0].audio,
          created_at: new Date().toISOString(),
        }));

      setRecitations(recitationsData);
    } catch (error) {
      console.error('Failed to load recitations:', error);
      // Fallback to mock data if API fails
      setRecitations([
        {
          id: '1',
          reciter_name: 'Mishary Al-Afasy',
          surah_name: 'Al-Fatihah',
          surah_number: 1,
          duration: '2:15',
          plays: 1247,
          likes: 234,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setFeedLoading(false);
    }
  };

  const calculateDuration = (verseCount: number): string => {
    // Rough estimate: 15 seconds per verse
    const totalSeconds = verseCount * 15;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecitationPress = async (item: Recitation) => {
    // Haptic feedback on tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Set current recitation for mini-player
    setCurrentRecitation(item);
    
    // Increment plays count in Supabase
    try {
      const { error } = await supabase
        .from('recitations')
        .update({ plays: (item.plays || 0) + 1 })
        .eq('id', item.id);
      
      if (error) {
        console.error('Error incrementing plays:', error);
      } else {
        console.log('Play count incremented!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    
    // Open player
    setSelectedRecitation(item);
  };

  const renderItem = ({ item }: { item: Recitation }) => (
    <TouchableOpacity 
      style={styles.recitationCard}
      onPress={() => handleRecitationPress(item)}
      activeOpacity={0.95}
    >
      <View style={styles.cardHeader}>
        <View style={styles.reciterInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.reciter_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.reciterDetails}>
            <Text style={styles.reciterName}>{item.reciter_name}</Text>
            <Text style={styles.surahName}>
              Surah {item.surah_number}: {item.surah_name}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Waveform preview */}
      <View style={styles.waveformContainer}>
        <Waveform bars={35} height={50} color="#10b981" />
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <Text style={styles.duration}>⏱ {item.duration}</Text>
          <Text style={styles.plays}>▶ {item.plays.toLocaleString()}</Text>
        </View>
        <View style={styles.actions}>
          <LikeButton 
            recitationId={item.id}
            initialLikes={item.likes || 0}
            onLike={(liked) => console.log('Liked:', liked)}
          />
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              shareRecitation({
                recitationId: item.id,
                surahName: item.surah_name,
                reciterName: item.reciter_name,
                audioUrl: item.audio_url,
              });
            }}
          >
            <Text style={styles.shareIcon}>↗️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>From your mosque to the world</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by surah, reciter..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <RecitationCardSkeleton />
          <RecitationCardSkeleton />
          <RecitationCardSkeleton />
        </View>
      ) : recitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recitations yet</Text>
          <Text style={styles.emptySubtext}>Be the first to share!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecitations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
          getItemLayout={(data, index) => ({
            length: 200, // Approximate item height
            offset: 200 * index,
            index,
          })}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          initialNumToRender={5}
          ListEmptyComponent={
            loading ? (
              <Text style={styles.emptyText}>Loading recitations...</Text>
            ) : (
              <Text style={styles.emptyText}>No recitations found</Text>
            )
          }
        />
      )}

      {/* Audio Player Modal */}
      <Modal
        visible={selectedRecitation !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedRecitation && (
          <AudioPlayer
            recitation={selectedRecitation}
            onClose={() => setSelectedRecitation(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  clearIcon: {
    fontSize: 18,
    color: '#94a3b8',
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  recitationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glassmorphism
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  cardHeader: {
    marginBottom: 12,
  },
  reciterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  reciterDetails: {
    flex: 1,
  },
  reciterName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  surahName: {
    fontSize: 14,
    color: '#64748b',
  },
  waveformContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 18,
  },
  duration: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  plays: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
});
