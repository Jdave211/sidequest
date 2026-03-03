import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSocialStore, useUserStore } from '../stores';

export default function Index() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const isOnboardingComplete = useUserStore((state) => state.isOnboardingComplete);
  const initDataLayer = useSocialStore((state) => state.initDataLayer);
  const teardownDataLayer = useSocialStore((state) => state.teardownDataLayer);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (authState.user) {
      initDataLayer(authState.user.id);
    }

    return () => {
      if (authState.user) teardownDataLayer();
    };
  }, [authState.user, initDataLayer, teardownDataLayer]);

  useEffect(() => {
    if (!isMounted || authState.isLoading) return;

    const timer = setTimeout(() => {
      if (!authState.user || !authState.onboardingState.isSignedIn) {
        router.replace('/welcome');
        return;
      }

      if (isOnboardingComplete()) {
        router.replace('/(tabs)/discover');
      } else if (!authState.onboardingState.hasCompletedWelcome) {
        router.replace('/welcome');
      } else if (!authState.onboardingState.hasCompletedProfile) {
        router.replace('/profile-setup');
      } else {
        router.replace('/(tabs)/discover');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMounted, router, authState, isOnboardingComplete]);

  return <View />;
}
