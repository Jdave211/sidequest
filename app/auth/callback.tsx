import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // This component just handles the OAuth callback route
    // The actual auth handling is done in UserContext via onAuthStateChange
    console.log('OAuth callback route hit');
    
    // Longer delay to allow session processing
    const timer = setTimeout(() => {
      console.log('Redirecting from callback to main app...');
      router.replace('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

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