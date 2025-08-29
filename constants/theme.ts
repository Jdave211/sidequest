import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screen size breakpoints
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

// Responsive scaling functions
const scale = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isMediumScreen) return size;
  return size * 1.1;
};

const verticalScale = (size: number): number => {
  if (screenHeight < 667) return size * 0.9;
  if (screenHeight >= 667 && screenHeight < 812) return size;
  return size * 1.1;
};

const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Ocean-inspired theme constants
export const Colors = {
  // Primary colors
  primary: '#4A90E2', // Light ocean blue
  primaryLight: '#6BA3E8',
  primaryDark: '#3A7BD5',
  
  // Neutrals (Airbnb's sophisticated grays)
  white: '#FFFFFF',
  gray50: '#F7F7F7',
  gray100: '#F0F0F0',
  gray200: '#DDDDDD',
  gray300: '#B0B0B0',
  gray400: '#717171',
  gray500: '#484848',
  gray600: '#222222',
  black: '#000000',
  
  // Semantic colors
  success: '#20B2AA', // Light sea green
  warning: '#FF8C42', // Ocean sunset orange
  error: '#FF6B6B', // Coral red
  info: '#4A90E2', // Ocean blue
  
  // Background colors
  background: '#FAFAFA', // Subtle off-white with warmth
  backgroundSecondary: '#F5F5F5', // Slightly darker off-white
  surface: '#FFFFFF', // Pure white for cards to create contrast
  backgroundTertiary: '#F9F9F9', // Very subtle texture background
  
  // Text colors
  textPrimary: '#222222',
  textSecondary: '#717171',
  textTertiary: '#B0B0B0',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#DDDDDD',
  borderLight: '#F0F0F0',
  
  // Status colors
  statusCompleted: '#20B2AA', // Light sea green
  statusInProgress: '#4A90E2', // Ocean blue
  statusPaused: '#FF8C42', // Ocean sunset orange
  statusNotStarted: '#717171',
  statusAbandoned: '#FF6B6B', // Coral red
  
  // Difficulty colors
  difficultyEasy: '#20B2AA', // Light sea green
  difficultyMedium: '#4A90E2', // Ocean blue
  difficultyHard: '#FF8C42', // Ocean sunset orange
  difficultyExpert: '#FF6B6B', // Coral red
};

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Responsive font sizes
  fontSize: {
    xs: moderateScale(12),
    sm: moderateScale(14),
    base: moderateScale(16),
    lg: moderateScale(18),
    xl: moderateScale(20),
    '2xl': moderateScale(24),
    '3xl': moderateScale(28),
    '4xl': moderateScale(32),
    '5xl': moderateScale(36),
  },
  
  // Responsive line heights
  lineHeight: {
    xs: moderateScale(16),
    sm: moderateScale(20),
    base: moderateScale(24),
    lg: moderateScale(28),
    xl: moderateScale(32),
    '2xl': moderateScale(36),
    '3xl': moderateScale(40),
    '4xl': moderateScale(44),
    '5xl': moderateScale(48),
  },
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  '2xl': scale(24),
  '3xl': scale(32),
  '4xl': scale(40),
  '5xl': scale(48),
  '6xl': scale(64),
};

export const BorderRadius = {
  xs: scale(4),
  sm: scale(6),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  '2xl': scale(20),
  '3xl': scale(24),
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.08,
    shadowRadius: scale(4),
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.12,
    shadowRadius: scale(8),
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.15,
    shadowRadius: scale(16),
    elevation: 16,
  },
};

// Responsive component dimensions
export const ComponentSizes = {
  // Button sizes
  button: {
    small: {
      paddingHorizontal: scale(12),
      paddingVertical: scale(8),
      minHeight: verticalScale(36),
    },
    medium: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      minHeight: verticalScale(44),
    },
    large: {
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      minHeight: verticalScale(52),
    },
  },
  
  // Input sizes
  input: {
    small: {
      paddingHorizontal: scale(12),
      paddingVertical: scale(8),
      minHeight: verticalScale(36),
    },
    medium: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      minHeight: verticalScale(44),
    },
    large: {
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      minHeight: verticalScale(52),
    },
  },
  
  // Card sizes
  card: {
    minHeight: verticalScale(120),
    padding: scale(16),
  },
  
  // Icon sizes
  icon: {
    small: scale(16),
    medium: scale(20),
    large: scale(24),
    xlarge: scale(32),
  },
  
  // Avatar sizes
  avatar: {
    small: scale(32),
    medium: scale(40),
    large: scale(48),
    xlarge: scale(64),
  },
  
  // Tab bar
  tabBar: {
    height: verticalScale(84),
    paddingBottom: verticalScale(20),
  },
  
  // FAB (Floating Action Button)
  fab: {
    size: scale(56),
    borderRadius: scale(28),
  },
  
  // Search bar
  searchBar: {
    height: verticalScale(44),
    paddingHorizontal: scale(16),
  },
  
  // Badge
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    minHeight: verticalScale(20),
  },
  
  // Category button (grid)
  categoryButton: {
    minWidth: screenWidth * 0.28, // 28% of screen width
    maxWidth: screenWidth * 0.31, // 31% of screen width
    aspectRatio: 1,
  },
  
  // Progress bar
  progressBar: {
    height: scale(6),
  },
  
  // Modal
  modal: {
    borderRadius: scale(16),
    padding: scale(20),
  },
};

// Component-specific styles with responsive sizing
export const Components = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: ComponentSizes.card.padding,
    minHeight: ComponentSizes.card.minHeight,
    ...Shadows.md,
  },
  
  button: {
    primary: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.md,
      ...ComponentSizes.button.medium,
    },
    secondary: {
      backgroundColor: Colors.white,
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      ...ComponentSizes.button.medium,
    },
    small: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.md,
      ...ComponentSizes.button.small,
    },
    large: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.md,
      ...ComponentSizes.button.large,
    },
  },
  
  input: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    ...ComponentSizes.input.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  
  searchBar: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    ...ComponentSizes.searchBar,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  
  badge: {
    ...ComponentSizes.badge,
    borderRadius: BorderRadius.full,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.borderLight,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    height: ComponentSizes.tabBar.height,
    paddingBottom: ComponentSizes.tabBar.paddingBottom,
    ...Shadows.sm,
  },
};

// Background textures and patterns
export const BackgroundTextures = {
  // Subtle noise pattern for main background
  subtle: {
    backgroundColor: Colors.background,
    // Add a very subtle pattern using linear gradient to simulate texture
    backgroundImage: `linear-gradient(45deg, ${Colors.backgroundTertiary} 25%, transparent 25%), 
                      linear-gradient(-45deg, ${Colors.backgroundTertiary} 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, ${Colors.backgroundTertiary} 75%), 
                      linear-gradient(-45deg, transparent 75%, ${Colors.backgroundTertiary} 75%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  },
  
  // Very subtle grain texture
  grain: {
    backgroundColor: Colors.background,
    opacity: 0.03,
  },
  
  // Subtle paper-like texture
  paper: {
    backgroundColor: Colors.background,
    // Very subtle shadow inset to create depth
    shadowColor: Colors.gray200,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
  },
};

// Responsive utilities
export const Responsive = {
  scale,
  verticalScale,
  moderateScale,
  screenWidth,
  screenHeight,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
};

// Utility functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return Colors.statusCompleted;
    case 'in_progress':
      return Colors.statusInProgress;
    case 'paused':
      return Colors.statusPaused;
    case 'abandoned':
      return Colors.statusAbandoned;
    default:
      return Colors.statusNotStarted;
  }
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return Colors.difficultyEasy;
    case 'Medium':
      return Colors.difficultyMedium;
    case 'Hard':
      return Colors.difficultyHard;
    case 'Expert':
      return Colors.difficultyExpert;
    default:
      return Colors.gray400;
  }
}; 