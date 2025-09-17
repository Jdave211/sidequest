import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { useSidequestStore, useSocialStore, useUserStore } from '../stores';

export default function Index() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const isOnboardingComplete = useUserStore((state) => state.isOnboardingComplete);
  const loadUserSidequests = useSidequestStore((state) => state.loadUserSidequests);
  const loadUserCircles = useSocialStore((state) => state.loadUserCircles);
  const loadGlobalActivityFeed = useSocialStore((state) => state.loadGlobalActivityFeed);
  
  const [isMounted, setIsMounted] = useState(false);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [dataPreloaded, setDataPreloaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Set minimum loading time of 2 seconds
    const minLoadingTimer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2000);
    
    return () => clearTimeout(minLoadingTimer);
  }, []);

  // Preload all data when user is authenticated
  useEffect(() => {
    if (authState.user && !dataPreloaded) {
      console.log('Preloading data for user:', authState.user.id);
      
      const preloadData = async () => {
        try {
          // Load all data in parallel
          await Promise.all([
            loadUserSidequests(authState.user.id),
            loadUserCircles(authState.user.id),
          ]);
          
          // After circles are loaded, load activity feed
          const socialStore = useSocialStore.getState();
          const circleIds = socialStore.userCircles.map(c => c.id);
          if (circleIds.length > 0) {
            await loadGlobalActivityFeed(circleIds);
          }
          
          console.log('Data preloading complete');
          setDataPreloaded(true);
        } catch (error) {
          console.error('Error preloading data:', error);
          setDataPreloaded(true); // Continue anyway
        }
      };
      
      preloadData();
    }
  }, [authState.user, dataPreloaded, loadUserSidequests, loadUserCircles, loadGlobalActivityFeed]);

  useEffect(() => {
    if (isMounted && !authState.isLoading && minLoadingComplete && dataPreloaded) {
      // Add a small delay to ensure the layout is fully mounted
      const timer = setTimeout(() => {
        console.log('Navigation check:', {
          isLoading: authState.isLoading,
          hasUser: !!authState.user,
          userEmail: authState.user?.email,
          hasCompletedWelcome: authState.onboardingState.hasCompletedWelcome,
          isSignedIn: authState.onboardingState.isSignedIn,
          hasCompletedProfile: authState.onboardingState.hasCompletedProfile,
          isOnboardingComplete: isOnboardingComplete(),
          dataPreloaded
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
  }, [isMounted, router, authState, isOnboardingComplete, minLoadingComplete, dataPreloaded]);

  // Show loading screen while checking authentication
  return (
    <LoadingScreen 
      message="Initializing Sidequest..."
      showLogo={true}
    />
  );
} 