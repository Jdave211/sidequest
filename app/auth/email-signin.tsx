import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useUserStore } from '../../stores';

export default function EmailSignIn() {
  const router = useRouter();
  const signInWithMagicLink = useUserStore((s) => (s as any).signInWithMagicLink);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSendLink = async () => {
    if (!email) return Alert.alert('Missing email', 'Enter your email');
    setIsLoading(true);
    try {
      await signInWithMagicLink(email.trim());
    } catch {}
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign in with email</Text>
        <View style={styles.field}>
          <Ionicons name="mail-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={onSendLink} disabled={isLoading}>
          <Text style={styles.primaryBtnText}>{isLoading ? 'Sending...' : 'Send magic link'}</Text>
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
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  secondaryBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
});


