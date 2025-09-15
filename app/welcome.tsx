import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useUserStore } from '../stores';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Background images array
const backgroundImages = [
  require('../assets/images/welcome_bg1.png'),
  require('../assets/images/welcome_bg2.png'),
  require('../assets/images/welcome_bg3.jpg'),
  require('../assets/images/welcome_bg4.jpg'),
  require('../assets/images/welcome_bg5.png'),
  require('../assets/images/welcome_bg6.png'),
  require('../assets/images/welcome_bg7.png'),
  require('../assets/images/welcome_bg8.png'),
];

export default function Welcome() {
  const router = useRouter();
  const signInWithGoogle = useUserStore((state) => state.signInWithGoogle);
  const completeWelcome = useUserStore((state) => state.completeWelcome);
  const authState = useUserStore((state) => state.authState);
  const [isLoading, setIsLoading] = useState(false);
  
  // Random background selection with better distribution
  const [backgroundImage] = useState(() => {
    // Use crypto-quality randomness for better distribution
    const now = Date.now();
    const randomSeed = (now * 9301 + 49297) % 233280;
    const randomValue = (randomSeed / 233280);
    const randomIndex = Math.floor(randomValue * backgroundImages.length);
    
    // Additional entropy from multiple sources
    const timeEntropy = (now % 1000) / 1000;
    const mathEntropy = Math.random();
    const combinedEntropy = (timeEntropy + mathEntropy + randomValue) % 1;
    const finalIndex = Math.floor(combinedEntropy * backgroundImages.length);
    
    // Log for debugging (remove in production)
    console.log(`[Welcome] Selected background index: ${finalIndex} (out of ${backgroundImages.length})`);
    
    return backgroundImages[finalIndex];
  });
  
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const buttonScale1 = useRef(new Animated.Value(0.8)).current;
  const buttonScale2 = useRef(new Animated.Value(0.8)).current;

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

  // Start animations on mount
  useEffect(() => {
    // Content fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Staggered button bounce animations
    setTimeout(() => {
      Animated.spring(buttonScale1, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 400);

    setTimeout(() => {
      Animated.spring(buttonScale2, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 600);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      completeWelcome();
      // Let route guards decide the next screen
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

  console.log('[Welcome] Rendering welcome page');

  return (
    <ImageBackground 
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          {/* Bottom content */}
          <View style={styles.bottomContent}>
            <Text style={styles.title}>Adventures that you can trust.</Text>
            <Text style={styles.subtitle}>
              Discover experiences you didn't even know were possible in your city.
            </Text>

            <View style={styles.authSection}>
              {/* Primary button per platform: Apple (iOS) or Google (Android) */}
              {Platform.OS === 'ios' ? (
                <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={8}
                    style={{ width: '100%', height: 50, marginBottom: Spacing.md }}
                    onPress={async () => {
                      try {
                        await useUserStore.getState().signInWithApple();
                      } catch {}
                    }}
                  />
                </Animated.View>
              ) : (
                <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
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
                      {isLoading ? 'Signing In...' : (Platform.OS === 'ios' as any ? 'Continue with Google' : 'Sign in with Google')}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Secondary button: Google (iOS) or Apple (Android) to comply with guidelines */}
              {Platform.OS === 'ios' ? (
                <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                  <TouchableOpacity
                    style={[styles.authButton, styles.googleButton, isLoading && styles.authButtonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="logo-google" 
                      size={ComponentSizes.icon.medium} 
                      color={Colors.textPrimary} 
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
                  <Text style={styles.appleCaption}>Continue with Apple</Text>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                    cornerRadius={8}
                    style={{ width: '100%', height: 50, marginTop: Spacing.sm }}
                    onPress={async () => {
                      try {
                        await useUserStore.getState().signInWithApple();
                      } catch {}
                    }}
                  />
                </Animated.View>
              )}
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
  },
  bottomContent: {
    paddingBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'left',
    marginBottom: Spacing.md,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: Spacing.xl * 2,
  },
  authSection: {
    marginTop: Spacing.lg,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    // Add subtle texture/gradient effect
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    // Additional texture via backdrop
    backdropFilter: 'blur(10px)',
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
  appleCaption: {
    textAlign: 'center',
    color: Colors.white,
    marginBottom: Spacing.xs,
    opacity: 0.9,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: Spacing.md,
  },
  // Success state styles
  successTitle: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 38,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl * 2,
  },
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loadingLogo: {
    width: 100,
    height: 100,
  },
  loadingTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  loadingQuote: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    fontStyle: 'italic',
  },
  loadingSpinner: {
    marginTop: Spacing.lg,
  },
}); 