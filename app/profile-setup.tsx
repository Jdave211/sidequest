import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useUserStore } from '../stores';

export default function ProfileSetup() {
  const router = useRouter();
  const completeProfile = useUserStore((state) => state.completeProfile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const authState = useUserStore((state) => state.authState);
  const [displayName, setDisplayName] = useState(authState.user?.displayName || '');

  // If user is already onboarded, skip this screen entirely
  useEffect(() => {
    if (!authState.isLoading) {
      if (!authState.user) {
        router.replace('/welcome');
        return;
      }
      if (authState.onboardingState.hasCompletedProfile) {
        router.replace('/(tabs)/social');
      }
    }
  }, [authState, router]);

  const handleContinue = () => {
    if (displayName.trim()) {
      updateProfile({ displayName: displayName.trim() });
    }
    completeProfile([]);
    router.push('/(tabs)/social');
  };

  const handleSkip = () => {
    completeProfile([]);
    router.push('/(tabs)/social');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person" 
              size={ComponentSizes.icon.xlarge} 
              color={Colors.primary} 
            />
          </View>
          <Text style={styles.title}>Quick Setup</Text>
          <Text style={styles.subtitle}>
            Tell us your name to personalize your experience
          </Text>
        </View>

        {/* Display Name */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name (optional)"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            maxLength={30}
          />
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons
              name="arrow-forward"
              size={ComponentSizes.icon.medium}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
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
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
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
    paddingHorizontal: Spacing.md,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  buttonContainer: {
    marginBottom: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  continueButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
}); 