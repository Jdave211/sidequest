import { Stack } from "expo-router";
import { SidequestProvider } from "../contexts/SidequestContext";
import { SocialProvider } from "../contexts/SocialContext";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <SidequestProvider>
        <SocialProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-sidequest" options={{ title: "Add Sidequest", presentation: "modal" }} />
          <Stack.Screen name="sidequest/[id]" options={{ title: "Sidequest Details" }} />
        </Stack>
        </SocialProvider>
      </SidequestProvider>
    </UserProvider>
  );
}
