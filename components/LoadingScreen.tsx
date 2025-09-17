import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  size?: 'small' | 'large';
  color?: string;
  backgroundColor?: string;
}

export default function LoadingScreen({
  message = 'Loading...',
  showLogo = true,
  size = 'large',
  color = Colors.primary,
  backgroundColor = Colors.background,
}: LoadingScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons 
              name="rocket" 
              size={ComponentSizes.icon.extraLarge} 
              color={Colors.white} 
            />
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        <ActivityIndicator 
          size={size} 
          color={color} 
          style={styles.spinner}
        />
        
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

// Full screen loading overlay
export function LoadingOverlay({
  message = 'Loading...',
  showLogo = false,
  size = 'large',
  color = Colors.primary,
}: Omit<LoadingScreenProps, 'backgroundColor'>) {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator 
          size={size} 
          color={color} 
          style={styles.spinner}
        />
        
        {message && (
          <Text style={styles.overlayMessage}>{message}</Text>
        )}
      </View>
    </View>
  );
}

// Inline loading component for buttons/forms
export function LoadingButton({
  loading = false,
  children,
  style,
  textStyle,
}: {
  loading?: boolean;
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
}) {
  return (
    <View style={[styles.buttonContainer, style]}>
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={Colors.white} 
          style={styles.buttonSpinner}
        />
      )}
      <Text style={[styles.buttonText, textStyle]}>{children}</Text>
    </View>
  );
}

// Loading card for content areas
export function LoadingCard({
  message = 'Loading content...',
  height = 200,
}: {
  message?: string;
  height?: number;
}) {
  return (
    <View style={[styles.card, { height }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.cardMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  logoContainer: {
    marginBottom: Spacing.xl,
  },
  
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  
  content: {
    alignItems: 'center',
  },
  
  spinner: {
    marginBottom: Spacing.lg,
  },
  
  message: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  
  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  overlayContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    ...Shadows.lg,
  },
  
  overlayMessage: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonSpinner: {
    marginRight: Spacing.sm,
  },
  
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  
  // Card styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    ...Shadows.sm,
  },
  
  cardMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
