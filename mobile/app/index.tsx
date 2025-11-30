import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/Onboarding';

const ONBOARDING_KEY = '@tilawa_onboarding_complete';

/**
 * Root index page - handles initial navigation
 * Redirects to appropriate screen based on auth state
 */
export default function Index() {
  const { session, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // Check onboarding status
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(value => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  // Show nothing while loading
  if (loading || hasSeenOnboarding === null) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  // Show onboarding if not seen and not authenticated
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

  // Redirect based on auth state
  if (session) {
    // User is authenticated, go to feed
    return <Redirect href="/(tabs)" />;
  }

  // User is not authenticated, go to sign-in
  return <Redirect href="/(auth)/sign-in" />;
}
