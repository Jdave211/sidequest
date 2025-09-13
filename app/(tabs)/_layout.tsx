import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors, Components, ComponentSizes, Typography } from '../../constants/theme';

export default function TabLayout() {
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
          title: 'My Sidequests',
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
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"}
              size={ComponentSizes.icon.medium}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
} 