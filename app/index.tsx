import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useUserStore } from '../stores';

export default function Index() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const isOnboardingComplete = useUserStore((state) => state.isOnboardingComplete);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Add a small delay to ensure the layout is fully mounted
      const timer = setTimeout(() => {
        console.log('Navigation check:', {
          isLoading: authState.isLoading,
          hasUser: !!authState.user,
          hasCompletedWelcome: authState.onboardingState.hasCompletedWelcome,
          isSignedIn: authState.onboardingState.isSignedIn,
          hasCompletedProfile: authState.onboardingState.hasCompletedProfile,
          isOnboardingComplete: isOnboardingComplete()
        });

        // Check onboarding state and route accordingly
        if (isOnboardingComplete()) {
          console.log('Navigating to social tabs');
          router.replace('/(tabs)/social');
        } else if (!authState.onboardingState.hasCompletedWelcome) {
          console.log('Navigating to welcome');
          router.replace('/welcome');
        } else if (!authState.onboardingState.hasCompletedProfile) {
          console.log('Navigating to profile setup');
          router.replace('/profile-setup');
        } else {
          console.log('Default navigation to social tabs');
          router.replace('/(tabs)/social');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted, router, authState, isOnboardingComplete]);

  // Render a simple view while waiting
  return <View style={{ flex: 1, backgroundColor: '#FAFAFA' }} />;
} 