import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { useUserStore } from '../../stores';

export default function TabLayout() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);
  const isOnboardingComplete = useUserStore((state) => state.isOnboardingComplete);

  useEffect(() => {
    if (!authState.isLoading) {
      if (!authState.user || !authState.onboardingState.isSignedIn) {
        router.replace('/welcome');
        return;
      }

      if (!isOnboardingComplete()) {
        if (!authState.onboardingState.hasCompletedWelcome) {
          router.replace('/welcome');
        } else if (!authState.onboardingState.hasCompletedProfile) {
          router.replace('/profile-setup');
        }
      }
    }
  }, [authState, isOnboardingComplete, router]);

  if (authState.isLoading || !authState.user || !authState.onboardingState.isSignedIn || !isOnboardingComplete()) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1D73EA',
        tabBarInactiveTintColor: '#7E8797',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#F8FAFD',
          borderTopColor: '#DFE4EC',
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 20,
          paddingTop: Spacing.sm,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="world"
        options={{
          title: 'World',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'globe' : 'globe-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'location' : 'location-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-sidequests"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
