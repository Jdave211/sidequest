import { Stack } from "expo-router";
import { useEffect } from "react";
import { useSidequestStore, useUserStore } from "../stores";

export default function RootLayout() {
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const initializeSampleData = useSidequestStore((state) => state.initializeSampleData);

  useEffect(() => {
    // Initialize auth and sample data when app starts
    let cleanup: (() => void) | undefined;
    
    const initialize = async () => {
      cleanup = await initializeAuth();
      initializeSampleData();
    };
    
    initialize();

    return () => {
      if (cleanup) cleanup();
    };
  }, [initializeAuth, initializeSampleData]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-sidequest" options={{ title: "Add Sidequest", presentation: "modal" }} />
      <Stack.Screen name="sidequest/[id]" options={{ title: "Sidequest Details" }} />
    </Stack>
  );
}
