import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { useSocialStore, useUserStore } from '../../stores';

export default function JoinSpace() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const authState = useUserStore((state) => state.authState);
  const joinCircle = useSocialStore((state) => state.joinCircle);
  const [isJoining, setIsJoining] = useState(false);
  const [status, setStatus] = useState<'checking' | 'joining' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Processing invite...');

  useEffect(() => {
    handleJoinFromLink();
  }, [code, authState.user]);

  const handleJoinFromLink = async () => {
    // Check if user is authenticated
    if (!authState.user) {
      setStatus('error');
      setMessage('Please sign in first');
      setTimeout(() => {
        router.replace('/welcome');
      }, 2000);
      return;
    }

    // Check if we have a valid code
    if (!code || typeof code !== 'string') {
      setStatus('error');
      setMessage('Invalid invite link');
      setTimeout(() => {
        router.replace('/(tabs)/social');
      }, 2000);
      return;
    }

    // Try to join the space
    try {
      setStatus('joining');
      setMessage('Joining space...');
      setIsJoining(true);

      const joinedCircle = await joinCircle(code.trim().toUpperCase(), authState.user.id);
      
      setStatus('success');
      setMessage(`Welcome to "${joinedCircle.name}"!`);
      
      // Navigate to spaces with activity feed active
      setTimeout(() => {
        router.replace('/(tabs)/social');
      }, 2000);
      
    } catch (error: any) {
      setStatus('error');
      if (error.message?.includes('already a member')) {
        setMessage('You\'re already in this space!');
        setTimeout(() => {
          router.replace('/(tabs)/social');
        }, 2000);
      } else if (error.message?.includes('Invalid circle code')) {
        setMessage('This invite link is invalid or expired');
        setTimeout(() => {
          router.replace('/(tabs)/social');
        }, 3000);
      } else {
        setMessage('Failed to join space. Please try again.');
        setTimeout(() => {
          router.replace('/(tabs)/social');
        }, 3000);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'joining':
        return <ActivityIndicator size="large" color={Colors.primary} />;
      case 'success':
        return <Text style={styles.emoji}>✓</Text>;
      case 'error':
        return <Text style={styles.emoji}>❌</Text>;
      default:
        return <ActivityIndicator size="large" color={Colors.primary} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return Colors.success;
      case 'error':
        return Colors.error;
      default:
        return Colors.textPrimary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {message}
          </Text>
          {code && (
            <Text style={styles.codeText}>
              Invite code: {code.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statusContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed,
  },
  codeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  emoji: {
    fontSize: 48,
  },
});
