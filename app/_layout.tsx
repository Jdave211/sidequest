import { Stack } from "expo-router";
import { useEffect } from "react";
import { useUserStore } from "../stores";

export default function RootLayout() {
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize auth when app starts (no longer loading sample data)
    let cleanup: (() => void) | undefined;
    
    const initialize = async () => {
      cleanup = await initializeAuth();
    };
    
    initialize();

    return () => {
      if (cleanup) cleanup();
    };
  }, [initializeAuth]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-sidequest" options={{ title: "Add Sidequest", presentation: "modal" }} />
      <Stack.Screen name="sidequest/[id]" options={{ title: "Sidequest Details" }} />
      <Stack.Screen name="settings" options={{ title: "Settings", presentation: "modal", headerShown: false }} />
      <Stack.Screen name="space/join" options={{ title: "Join Space", headerShown: false }} />
      <Stack.Screen name="space/create" options={{ title: "Create Space", headerShown: false }} />
      <Stack.Screen name="space/add-sidequest" options={{ title: "Add to Space", headerShown: false }} />
      <Stack.Screen name="space/[id]" options={{ title: "Space", headerShown: false }} />
    </Stack>
  );
}
