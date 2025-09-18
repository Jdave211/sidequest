import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BorderRadius, Colors, ComponentSizes, Shadows, Spacing, Typography } from '../constants/theme';

interface QuoteScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

const QUOTES = [
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "Adventure awaits those who dare to seek it.",
    author: "Unknown"
  },
  {
    text: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller"
  },
  {
    text: "The biggest adventure you can take is to live the life of your dreams.",
    author: "Oprah Winfrey"
  },
  {
    text: "Every sidequest is a step toward your main quest.",
    author: "Sidequest Team"
  },
  {
    text: "The world is a book, and those who do not travel read only one page.",
    author: "Saint Augustine"
  },
  {
    text: "Not all those who wander are lost.",
    author: "J.R.R. Tolkien"
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  }
];

export default function QuoteScreen({ 
  onComplete, 
  duration = 3000 
}: QuoteScreenProps) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(50));

  const currentQuote = QUOTES[currentQuoteIndex];

  useEffect(() => {
    // Animate in the current quote
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Cycle through quotes
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, duration);

    // Complete after showing all quotes or after total duration
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, QUOTES.length * duration);

    return () => {
      clearInterval(quoteInterval);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  // Animate out and in when quote changes
  useEffect(() => {
    if (currentQuoteIndex > 0) {
      // Fade out current quote
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset and fade in new quote
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentQuoteIndex]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <View style={styles.gradientBackground} />
      
      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(6)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * Dimensions.get('window').width,
                top: Math.random() * Dimensions.get('window').height,
                animationDelay: i * 200,
              },
            ]}
          />
        ))}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <BlurView intensity={20} style={styles.logoBlur}>
            <View style={styles.logoCircle}>
              <Ionicons 
                name="rocket" 
                size={ComponentSizes.icon.extraLarge} 
                color={Colors.white} 
              />
            </View>
          </BlurView>
        </View>

        {/* Quote card */}
        <Animated.View
          style={[
            styles.quoteCard,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <BlurView intensity={15} style={styles.quoteBlur}>
            <View style={styles.quoteContent}>
              {/* Quote text */}
              <Text style={styles.quoteText}>
                "{currentQuote.text}"
              </Text>
              
              {/* Author */}
              <Text style={styles.quoteAuthor}>
                — {currentQuote.author}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {QUOTES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentQuoteIndex 
                    ? Colors.white 
                    : 'rgba(255, 255, 255, 0.3)',
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  logoContainer: {
    marginBottom: Spacing.xxl,
  },
  
  logoBlur: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  
  quoteCard: {
    width: '100%',
    maxWidth: 400,
    marginBottom: Spacing.xxl,
  },
  
  quoteBlur: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  quoteContent: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  
  quoteText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xl,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  
  quoteAuthor: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
