import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import MiniPlayer from '../../components/MiniPlayer';
import { useAppStore } from '../../lib/store';
import { useAuth } from '../../lib/auth-context';
import { getUnreadCount, subscribeToNotifications } from '../../lib/notifications-service';

export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentRecitation } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Subscribe to new notifications
      const unsubscribe = subscribeToNotifications(user.id, () => {
        loadUnreadCount();
      });

      return unsubscribe;
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    const count = await getUnreadCount(user.id);
    setUnreadCount(count);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#10b981',
          tabBarStyle: {
            paddingBottom: currentRecitation ? 60 : 0, // Space for mini-player
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Record',
            tabBarLabel: 'Upload',
            tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarLabel: 'Notifications',
            tabBarIcon: ({ color }) => (
              <View>
                <View style={{ width: 24, height: 24, backgroundColor: color }} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <View style={{ width: 24, height: 24, backgroundColor: color }} />,
          }}
        />
      </Tabs>
      
      {/* Mini Player - Always visible when audio is playing */}
      {currentRecitation && (
        <MiniPlayer onPress={() => {
          // TODO: Open full player modal
          console.log('Open full player');
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
