import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/Onboarding';

const ONBOARDING_KEY = '@tilawa_onboarding_complete';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      router.replace('/(auth)/sign-in');
    }
  };

  return <Onboarding onComplete={handleComplete} />;
}
