import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { AuthProvider, useAuth } from '../lib/auth-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/Onboarding';
import { registerForPushNotifications, savePushToken, setupNotificationListeners } from '../lib/notifications-service';

// Initialize Sentry
if (Constants.expoConfig?.extra?.sentryDsn) {
  Sentry.init({
    dsn: Constants.expoConfig.extra.sentryDsn,
    debug: __DEV__,
  });
}

// Initialize PostHog
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

let posthog: PostHog | null = null;
if (posthogApiKey && posthogHost) {
  posthog = new PostHog(posthogApiKey, { host: posthogHost });
}

const ONBOARDING_KEY = '@tilawa_onboarding_complete';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check onboarding status
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(value => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  useEffect(() => {
    if (loading || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, hasSeenOnboarding]);

  // Setup push notifications
  useEffect(() => {
    if (!session) return;

    // Register for push notifications
    registerForPushNotifications().then(token => {
      if (token && session.user) {
        savePushToken(session.user.id, token);
      }
    });

    // Setup notification listeners
    const cleanup = setupNotificationListeners();

    return cleanup;
  }, [session]);

  // Show onboarding if not seen
  if (hasSeenOnboarding === false && !session) {
    return (
      <Onboarding 
        onComplete={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          setHasSeenOnboarding(true);
        }} 
      />
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
