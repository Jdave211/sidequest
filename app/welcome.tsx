import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useUserStore } from '../stores';

export default function Welcome() {
  const router = useRouter();
  const signInWithGoogle = useUserStore((state) => state.signInWithGoogle);
  const completeWelcome = useUserStore((state) => state.completeWelcome);
  const authState = useUserStore((state) => state.authState);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already authenticated/onboarded, skip welcome
  useEffect(() => {
    if (!authState.isLoading && authState.user) {
      if (authState.onboardingState.hasCompletedProfile) {
        router.replace('/(tabs)/social');
      } else {
        router.replace('/profile-setup');
      }
    }
  }, [authState, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      completeWelcome();
      // Let index route / guards decide next screen based on onboarding state
      router.replace('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/auth/email-signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="compass" 
              size={ComponentSizes.icon.xlarge} 
              color={Colors.primary} 
            />
          </View>
          
          <Text style={styles.title}>Sidequest</Text>
          <Text style={styles.subtitle}>
            Discover adventures and challenge yourself
          </Text>
        </View>

        {/* Sign In Options */}
        <View style={styles.authSection}>
          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.authButton, styles.googleButton, isLoading && styles.authButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator 
                size="small" 
                color={Colors.primary} 
                style={{ marginRight: Spacing.sm }}
              />
            ) : (
              <Ionicons 
                name="logo-google" 
                size={ComponentSizes.icon.medium} 
                color={Colors.textPrimary} 
              />
            )}
            <Text style={styles.googleButtonText}>
              {isLoading ? 'Signing In...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign In (auxiliary) */}
          <TouchableOpacity
            style={[styles.authButton, styles.googleButton, isLoading && styles.authButtonDisabled]}
            onPress={handleEmailSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="mail-outline" 
              size={ComponentSizes.icon.medium} 
              color={Colors.textPrimary} 
            />
            <Text style={styles.googleButtonText}>Continue with Email</Text>
          </TouchableOpacity>

          
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  authSection: {
    marginBottom: Spacing.xl,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: 50,
    ...Shadows.sm,
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  appleButton: {
    height: 50,
    marginBottom: Spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
}); 