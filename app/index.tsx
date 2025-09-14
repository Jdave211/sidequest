import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/theme';
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
    if (isMounted && !authState.isLoading) {
      // Add a small delay to ensure the layout is fully mounted
      const timer = setTimeout(() => {
        console.log('Navigation check:', {
          isLoading: authState.isLoading,
          hasUser: !!authState.user,
          userEmail: authState.user?.email,
          hasCompletedWelcome: authState.onboardingState.hasCompletedWelcome,
          isSignedIn: authState.onboardingState.isSignedIn,
          hasCompletedProfile: authState.onboardingState.hasCompletedProfile,
          isOnboardingComplete: isOnboardingComplete()
        });

        // AUTHENTICATION GUARD: Only allow access if user is actually signed in
        if (!authState.user || !authState.onboardingState.isSignedIn) {
          console.log('User not authenticated, redirecting to welcome');
          router.replace('/welcome');
          return;
        }

        // User is authenticated, check onboarding state
        if (isOnboardingComplete()) {
          console.log('User fully onboarded, navigating to main app');
          router.replace('/(tabs)/social');
        } else if (!authState.onboardingState.hasCompletedWelcome) {
          console.log('User needs to complete welcome');
          router.replace('/welcome');
        } else if (!authState.onboardingState.hasCompletedProfile) {
          console.log('User needs to complete profile setup');
          router.replace('/profile-setup');
        } else {
          console.log('Fallback navigation to main app');
          router.replace('/(tabs)/social');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted, router, authState, isOnboardingComplete]);

  // Show loading spinner while checking authentication
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: Colors.background,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
} 