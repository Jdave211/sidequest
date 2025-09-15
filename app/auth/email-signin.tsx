import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../../constants/theme';
import { useUserStore } from '../../stores';

export default function EmailSignIn() {
  const router = useRouter();
  const signInWithOTP = useUserStore((s) => s.signInWithOTP);
  const verifyOTP = useUserStore((s) => s.verifyOTP);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');

  const onSendCode = async () => {
    if (!email.trim()) return Alert.alert('Missing email', 'Enter your email address');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert('Invalid email', 'Please enter a valid email address');
    }

    setIsLoading(true);
    try {
      await signInWithOTP(email.trim());
      setStep('code');
      Alert.alert(
        'Code sent!', 
        'Check your email for a 6-digit verification code and enter it below.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Failed to send code:', error);
      Alert.alert('Error', error?.message || 'Failed to send verification code. Please try again.');
    }
    setIsLoading(false);
  };

  const onVerifyCode = async () => {
    if (!code.trim()) return Alert.alert('Missing code', 'Enter the 6-digit code from your email');
    
    if (code.trim().length !== 6) {
      return Alert.alert('Invalid code', 'Please enter the complete 6-digit code');
    }

    setIsLoading(true);
    try {
      await verifyOTP(email.trim(), code.trim());
      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      console.error('Failed to verify code:', error);
      Alert.alert('Error', error?.message || 'Invalid code. Please check your email and try again.');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => step === 'code' ? setStep('email') : router.back()}
          >
            <Ionicons name="arrow-back" size={ComponentSizes.icon.large} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {step === 'email' ? 'Sign in with email' : 'Enter verification code'}
        </Text>
        
        {step === 'email' ? (
          <>
            <Text style={styles.subtitle}>
              We'll send you a 6-digit code to verify your email address
            </Text>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSendCode} disabled={isLoading}>
              <Text style={styles.primaryBtnText}>{isLoading ? 'Sending...' : 'Send verification code'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to{'\n'}{email}
            </Text>
            <View style={styles.field}>
              <Ionicons name="shield-checkmark-outline" size={ComponentSizes.icon.medium} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!isLoading}
                autoFocus={true}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={onVerifyCode} disabled={isLoading}>
              <Text style={styles.primaryBtnText}>{isLoading ? 'Verifying...' : 'Verify code'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSendCode} disabled={isLoading}>
              <Text style={styles.secondaryBtnText}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}
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
  header: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
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


