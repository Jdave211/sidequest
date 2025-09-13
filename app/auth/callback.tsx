import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Note: This callback is no longer used with in-app browser OAuth
    // The WebBrowser handles authentication entirely within the app
    // Redirecting back to main app immediately
    console.log('Auth callback hit - redirecting to main app...');
    router.replace('/');
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
        Redirecting...
      </Text>
    </View>
  );
} 