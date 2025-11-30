import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, FlatList, ActivityIndicator, Image, Animated } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getFollowersCount, getFollowingCount } from '../../lib/social';
import * as Haptics from 'expo-haptics';
import Analytics from '../../lib/analytics';
import EditProfileModal from '../../components/EditProfileModal';
import { ProfileSkeleton } from '../../components/SkeletonLoader';
import { useAppStore } from '../../lib/store';

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recitations, setRecitations] = useState<any[]>([]);
  const [likedRecitations, setLikedRecitations] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'recitations' | 'liked'>('recitations');
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
      loadRecitations();
      loadLikedData();
      
      // Animate on mount
      Animated.stagger(200, [
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

  const loadLikedData = async () => {
    const liked = await loadLikedRecitations();
    setLikedRecitations(liked);
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    const followers = await getFollowersCount(user.id);
    const following = await getFollowingCount(user.id);
    setFollowersCount(followers);
    setFollowingCount(following);
  };

  const loadRecitations = async () => {
    try {
      const { data, error } = await supabase
        .from('recitations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecitations(data || []);
    } catch (error) {
      console.error('Error loading recitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikedRecitations = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          recitation_id,
          recitations (
            id,
            surah_name,
            surah_number,
            plays,
            likes,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Extract recitations from the join
      const likedRecs = (data || [])
        .map((like: any) => like.recitations)
        .filter(Boolean);
      
      return likedRecs;
    } catch (error) {
      console.error('Error loading liked recitations:', error);
      return [];
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Analytics.signOut();
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleDeleteRecitation = async (recitationId: string, audioUrl: string) => {
    Alert.alert(
      'Delete Recitation',
      'Are you sure you want to delete this recitation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              // Delete from storage
              if (audioUrl) {
                const path = audioUrl.split('/').slice(-2).join('/');
                await supabase.storage.from('recitations').remove([path]);
              }
              
              // Delete from database
              const { error, count } = await supabase
                .from('recitations')
                .delete({ count: 'exact' })
                .eq('id', recitationId)
                .eq('user_id', user?.id);

              if (error) {
                console.error('Delete error:', error);
                throw new Error(`Failed to delete: ${error.message}`);
              }

              if (count === 0) {
                throw new Error('Recitation not found or you do not have permission to delete it');
              }

              console.log('Successfully deleted recitation:', recitationId);

              // Update local state
              setRecitations(prev => prev.filter(r => r.id !== recitationId));
              
              // Update global store (feed)
              const { recitations: feedRecitations, setRecitations: setFeedRecitations } = useAppStore.getState();
              setFeedRecitations(feedRecitations.filter(r => r.id !== recitationId));
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'Recitation deleted successfully');
            } catch (error) {
              console.error('Error deleting recitation:', error);
              Alert.alert('Error', 'Failed to delete recitation');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const renderRecitationItem = ({ item }: { item: any }) => (
    <View style={styles.recitationCard}>
      <View style={styles.recitationHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recitationTitle}>{item.surah_name}</Text>
          <Text style={styles.recitationDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {tab === 'recitations' && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleDeleteRecitation(item.id, item.audio_url);
            }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.recitationStats}>
        <Text style={styles.recitationStat}>▶ {item.plays || 0}</Text>
        <Text style={styles.recitationStat}>❤️ {item.likes || 0}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <ProfileSkeleton />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          {/* Avatar with Premium Shadow */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {(profile?.full_name || user?.email)?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
          
          <Text style={styles.name}>{profile?.full_name || 'Reciter'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          {/* Edit Button Premium */}
          <TouchableOpacity
            style={styles.editButtonPremium}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.editButtonPremiumText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Premium Stats Cards */}
      <Animated.View style={[styles.statsContainerPremium, { opacity: statsOpacity }]}>
        <View style={styles.statCardPremium}>
          <Text style={styles.statNumberPremium}>{recitations.length}</Text>
          <Text style={styles.statLabelPremium}>Recitations</Text>
        </View>
        <View style={styles.statCardPremium}>
          <Text style={styles.statNumberPremium}>{followersCount}</Text>
          <Text style={styles.statLabelPremium}>Followers</Text>
        </View>
        <View style={styles.statCardPremium}>
          <Text style={styles.statNumberPremium}>{followingCount}</Text>
          <Text style={styles.statLabelPremium}>Following</Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'recitations' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('recitations');
          }}
        >
          <Text style={[styles.tabText, tab === 'recitations' && styles.tabTextActive]}>
            My Recitations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'liked' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('liked');
          }}
        >
          <Text style={[styles.tabText, tab === 'liked' && styles.tabTextActive]}>
            Liked
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recitations List */}
      {tab === 'recitations' && (
        <View style={styles.recitationsList}>
          {recitations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎙️</Text>
              <Text style={styles.emptyTitle}>No recitations yet</Text>
              <Text style={styles.emptySubtitle}>Start recording your first recitation!</Text>
            </View>
          ) : (
            recitations.map((item) => (
              <View key={item.id}>
                {renderRecitationItem({ item })}
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'liked' && (
        <View style={styles.recitationsList}>
          {likedRecitations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={styles.emptyTitle}>No liked recitations</Text>
              <Text style={styles.emptySubtitle}>Like recitations to see them here</Text>
            </View>
          ) : (
            likedRecitations.map((item) => (
              <View key={item.id}>
                {renderRecitationItem({ item })}
              </View>
            ))
          )}
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Notifications settings coming soon!')}
        >
          <Text style={styles.menuItemText}>🔔 Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Coming Soon', 'Privacy settings coming soon!')}
        >
          <Text style={styles.menuItemText}>🔒 Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Help', 'Contact us at support@tilawa.app')}
        >
          <Text style={styles.menuItemText}>❓ Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Tilawa v1.0.0 Beta</Text>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        currentName={profile?.full_name || ''}
        currentBio={profile?.bio || ''}
        userId={user?.id || ''}
        onSave={(name, bio) => {
          setProfile({ ...profile, full_name: name, bio });
        }}
      />
    </ScrollView>
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
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  editButton: {
    marginTop: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#10b981',
  },
  recitationsList: {
    backgroundColor: '#fff',
  },
  recitationCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  recitationDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
  recitationStats: {
    flexDirection: 'row',
    gap: 16,
  },
  recitationStat: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  signOutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Premium styles
  editButtonPremium: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonPremiumText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainerPremium: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCardPremium: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statNumberPremium: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabelPremium: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 24,
  },
});
