import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useUserStore } from '../../stores';

export default function AuthCallback() {
  const router = useRouter();
  const authState = useUserStore((state) => state.authState);

  useEffect(() => {
    console.log('🔗 Auth callback hit - processing authentication...');
    
    // Give a moment for auth state to update from magic link
    const timer = setTimeout(() => {
      if (authState.user && authState.onboardingState.isSignedIn) {
        console.log('✅ Magic link authentication successful, redirecting to main app');
        router.replace('/');
      } else {
        console.log('❌ Authentication failed, redirecting to welcome');
        router.replace('/welcome');
      }
    }, 1000); // Wait 1 second for auth state to update

    return () => clearTimeout(timer);
  }, [router, authState]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    }}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: Colors.textSecondary,
      }}>
        Completing sign in...
      </Text>
    </View>
  );
} 