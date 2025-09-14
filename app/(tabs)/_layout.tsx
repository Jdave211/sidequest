import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors, Components, ComponentSizes, Typography } from '../../constants/theme';
import { useUserStore } from '../../stores';

export default function TabLayout() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const isOnboardingComplete = useUserStore((state) => state.isOnboardingComplete);

  // 🔐 AUTHENTICATION GUARD: Protect main app access
  useEffect(() => {
    if (!authState.isLoading) {
      // Check if user is properly authenticated
      if (!authState.user || !authState.onboardingState.isSignedIn) {
        console.log('Unauthorized access to main app, redirecting to welcome');
        router.replace('/welcome');
        return;
      }

      // Check if user has completed onboarding
      if (!isOnboardingComplete()) {
        console.log('Incomplete onboarding, redirecting to setup');
        if (!authState.onboardingState.hasCompletedWelcome) {
          router.replace('/welcome');
        } else if (!authState.onboardingState.hasCompletedProfile) {
          router.replace('/profile-setup');
        }
        return;
      }

      console.log('User authenticated and onboarded, allowing main app access');
    }
  }, [authState, isOnboardingComplete, router]);

  // Show loading while checking authentication
  if (authState.isLoading) {
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

  // Don't render tabs if user is not properly authenticated
  if (!authState.user || !authState.onboardingState.isSignedIn || !isOnboardingComplete()) {
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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          ...Components.tabBar,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontSize: Typography.fontSize.xl,
          fontWeight: Typography.fontWeight.semibold,
          color: Colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="social"
        options={{
          title: 'Spaces',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={ComponentSizes.icon.medium} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-sidequests"
        options={{
          title: authState.user?.displayName ? `${authState.user.displayName}'s Sidequests` : 'My Sidequests',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "list" : "list-outline"} 
              size={ComponentSizes.icon.medium} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
} 