// Polyfills for React Native
import 'react-native-get-random-values';
// @ts-ignore - text-encoding doesn't have types
import { TextEncoder, TextDecoder } from 'text-encoding';

// @ts-ignore
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { AuthProvider, useAuth } from '../lib/auth-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/Onboarding';
import { registerForPushNotifications, savePushToken, setupNotificationListeners } from '../lib/notifications-service';
import ErrorBoundary from '../components/ErrorBoundary';

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
  const { session } = useAuth();

  // Navigation is now handled by /app/index.tsx
  // No automatic redirects here to prevent navigation errors

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

  // Onboarding is now handled by /app/index.tsx

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}
