import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, RefreshControl, TextInput, Animated, ScrollView } from 'react-native';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api-client';
import AudioPlayer from '../../components/AudioPlayer';
import Waveform from '../../components/Waveform';
import AnimatedWaveform from '../../components/AnimatedWaveform';
import PressableCard from '../../components/PressableCard';
import LikeButton from '../../components/LikeButton';
import LoadingScreen from '../../components/LoadingScreen';
import Icon from '../../components/Icon';
import * as Haptics from 'expo-haptics';
import { getSurahAudio, AVAILABLE_RECITERS } from '../../lib/quran-audio-service';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { shareRecitation } from '../../lib/share';
import { retrySupabaseQuery } from '../../lib/retry';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [selectedRecitation, setSelectedRecitation] = useState<Recitation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Discovery sections
  const [trendingRecitations, setTrendingRecitations] = useState<Recitation[]>([]);
  const [featuredReciter, setFeaturedReciter] = useState<any>(null);
  const [newReciters, setNewReciters] = useState<any[]>([]);
  const [popularSurahs, setPopularSurahs] = useState<any[]>([]);
  
  // Animation refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.95)).current;
  const sectionsOpacity = useRef(new Animated.Value(0)).current;
  
  // Use global store
  const { 
    recitations, 
    feedLoading: loading,
    currentRecitation,
    setRecitations,
    setFeedLoading,
    setCurrentRecitation,
    incrementPlays
  } = useAppStore();

  useEffect(() => {
    loadRecitations();
    loadDiscoverySections();
  }, []);

  // Animate when loading finishes
  useEffect(() => {
    if (!loading) {
      // Animate header
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
      // Animate sections after header
      setTimeout(() => {
        Animated.timing(sectionsOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 300);
    }
  }, [loading]);

  const loadDiscoverySections = async () => {
    try {
      // Load trending (most played in last 7 days)
      const { data: trending } = await supabase
        .from('recitations')
        .select('*')
        .eq('status', 'ready')
        .order('plays', { ascending: false })
        .limit(5);
      
      if (trending) {
        const formattedTrending = await formatRecitations(trending);
        setTrendingRecitations(formattedTrending);
      }

      // Load new reciters (users who joined in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(5);
      
      if (newUsers) {
        setNewReciters(newUsers);
      }

      // Load popular surahs (most recited)
      const { data: surahs } = await supabase
        .from('recitations')
        .select('surah_number, surah_name')
        .eq('status', 'ready');
      
      if (surahs) {
        // Count occurrences
        const surahCounts = surahs.reduce((acc: any, rec: any) => {
          const key = `${rec.surah_number}-${rec.surah_name}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        
        // Get top 4
        const topSurahs = Object.entries(surahCounts)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 4)
          .map(([key, count]) => {
            const [number, name] = key.split('-');
            return { surah_number: parseInt(number), surah_name: name, count };
          });
        
        setPopularSurahs(topSurahs);
      }

      // Featured reciter (most active in last 30 days)
      const { data: activeUsers } = await supabase
        .from('recitations')
        .select('user_id')
        .eq('status', 'ready');
      
      if (activeUsers && activeUsers.length > 0) {
        const userCounts = activeUsers.reduce((acc: any, rec: any) => {
          acc[rec.user_id] = (acc[rec.user_id] || 0) + 1;
          return acc;
        }, {});
        
        const topUserId = Object.entries(userCounts)
          .sort(([, a]: any, [, b]: any) => b - a)[0]?.[0];
        
        if (topUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', topUserId)
            .single();
          
          if (profile) {
            const { data: userRecs } = await supabase
              .from('recitations')
              .select('*')
              .eq('user_id', topUserId)
              .eq('status', 'ready');
            
            setFeaturedReciter({
              ...profile,
              recitationsCount: userRecs?.length || 0,
              totalPlays: userRecs?.reduce((sum: number, r: any) => sum + (r.plays || 0), 0) || 0,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading discovery sections:', error);
    }
  };

  const formatRecitations = async (recs: any[]): Promise<Recitation[]> => {
    if (!recs || recs.length === 0) return [];
    
    const userIds = [...new Set(recs.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);
    
    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
    
    return recs.map((rec: any) => {
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
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await loadRecitations(0, false);
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadRecitations(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

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

  const loadRecitations = async (pageNum: number = 0, append: boolean = false) => {
    if (!append) {
      setFeedLoading(true);
    }
    try {
      console.log('🔄 Loading recitations...');
      const ITEMS_PER_PAGE = 10;
      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // ✅ LOAD REAL USER RECITATIONS FROM SUPABASE with pagination
      const { data: userRecitations, error: recitationsError } = await supabase
        .from('recitations')
        .select('*')
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (recitationsError) {
        console.error('❌ Error loading recitations:', recitationsError);
        throw recitationsError;
      }

      console.log('✅ Loaded recitations:', userRecitations?.length || 0);

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

        // Check if we have more data
        setHasMore(userRecitations.length === 10);
        
        // Append or replace recitations
        if (append) {
          setRecitations([...recitations, ...formattedRecitations]);
        } else {
          setRecitations(formattedRecitations);
        }
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
      console.error('❌ Failed to load recitations:', error);
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
      console.log('✅ Setting feedLoading to false');
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
    <PressableCard 
      style={styles.recitationCard}
      onPress={() => handleRecitationPress(item)}
      hapticStyle="medium"
      scaleValue={0.98}
    >
      <View style={styles.reciterInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.reciter_name.charAt(0)}
          </Text>
        </View>
        <View style={styles.reciterDetails}>
          <Text style={styles.reciterName}>{item.reciter_name}</Text>
          <Text style={styles.surahName}>
            {item.surah_name}
          </Text>
        </View>
        <View style={styles.playIconContainer}>
          <Icon name="play" size={24} color="#10b981" />
        </View>
      </View>
    </PressableCard>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingScreen message="Loading recitations..." />
      ) : (
        <>
          {/* Premium Header with Gradient */}
          <LinearGradient
            colors={['#10b981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
              <Text style={styles.headerTitle}>Discover</Text>
              <Text style={styles.headerSubtitle}>From your mosque to the world</Text>
              
              {/* Premium Search Bar with Glassmorphism */}
              <Animated.View 
                style={[
                  styles.searchContainer,
                  searchFocused && styles.searchFocused,
                  { transform: [{ scale: searchScale }] }
                ]}
              >
                <Icon name="search" size={18} color={searchFocused ? '#10b981' : '#64748b'} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by surah, reciter..."
                  placeholderTextColor="rgba(15, 23, 42, 0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => {
                    setSearchFocused(true);
                    Animated.spring(searchScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onBlur={() => {
                    setSearchFocused(false);
                    Animated.spring(searchScale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchQuery('');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 18, fontWeight: '600' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </Animated.View>
          </LinearGradient>
      
          {recitations.length === 0 && trendingRecitations.length === 0 ? (
            <ScrollView 
              contentContainerStyle={styles.emptyContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#10b981"
                />
              }
            >
              <Animated.View style={[styles.emptyContent, { opacity: sectionsOpacity }]}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                  style={styles.emptyIconContainer}
                >
                  <Text style={styles.emptyIcon}>🎙️</Text>
                </LinearGradient>
                <Text style={styles.emptyTitle}>Welcome to Tilawa!</Text>
                <Text style={styles.emptyText}>
                  Discover amazing Quran recitations from around the world.{'\n'}
                  Join our community of reciters today.
                </Text>
                <PressableCard
                  style={styles.emptyButton}
                  onPress={() => {
                    router.push('/(tabs)/upload');
                  }}
                  hapticStyle="medium"
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={styles.emptyButtonText}>🎙️ Start Recording</Text>
                  </LinearGradient>
                </PressableCard>
                <TouchableOpacity 
                  style={styles.emptySecondaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onRefresh();
                  }}
                >
                  <Text style={styles.emptySecondaryButtonText}>🔄 Refresh Feed</Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#10b981"
                  colors={['#10b981']}
                />
              }
            >
              <Animated.View style={{ opacity: sectionsOpacity }}>

            {/* New Reciters */}
            {newReciters.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🆕</Text>
                  <Text style={styles.sectionTitle}>New Reciters</Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {newReciters.map((reciter) => (
                    <TouchableOpacity
                      key={reciter.id}
                      style={styles.newReciterCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                      <View style={styles.newReciterAvatar}>
                        <Text style={styles.newReciterAvatarText}>
                          {(reciter.full_name || reciter.email || 'A').charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.newReciterName} numberOfLines={1}>
                        {reciter.full_name || reciter.email || 'Anonymous'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* All Recitations */}
            {filteredRecitations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🎵</Text>
                  <Text style={styles.sectionTitle}>All Recitations</Text>
                </View>
                {filteredRecitations.map((item) => renderItem({ item }))}
              </View>
            )}
              </Animated.View>
            </ScrollView>
          )}
        </>
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 24,
  },
  recitationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  reciterDetails: {
    flex: 1,
  },
  reciterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  surahName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 20,
    marginVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  // Empty State
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySecondaryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptySecondaryButtonText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  // Trending Cards
  trendingCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  trendingAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  trendingReciter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  trendingSurah: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  trendingPlays: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  // Featured Card
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  featuredGradient: {
    padding: 32,
    alignItems: 'center',
  },
  featuredAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  featuredAvatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  featuredName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 32,
  },
  featuredStat: {
    alignItems: 'center',
  },
  featuredStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  featuredStatLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  // New Reciters
  newReciterCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  newReciterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newReciterAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  newReciterName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  // Surah Grid
  surahGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  surahCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  surahNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10b981',
    marginBottom: 8,
  },
  surahCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  surahCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});
