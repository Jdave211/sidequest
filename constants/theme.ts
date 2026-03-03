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
  // Primary colors - Updated to match the "TripBFF" blue
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051A8',
  
  // Neutrals
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
  
  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5856D6',
  
  // Background colors
  background: '#F2F2F7', // iOS system grouped background
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  backgroundTertiary: '#E5E5EA',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#6B7280', // Gray for secondary text
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  statusCompleted: '#34C759',
  statusInProgress: '#007AFF',
  statusPaused: '#FF9500',
  statusNotStarted: '#9CA3AF',
  statusAbandoned: '#FF3B30',
  
  // Difficulty colors
  difficultyEasy: '#34C759',
  difficultyMedium: '#007AFF',
  difficultyHard: '#FF9500',
  difficultyExpert: '#FF3B30',
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
    heavy: '800' as const,
  },
  
  // Responsive font sizes
  fontSize: {
    xs: moderateScale(12),
    sm: moderateScale(13), // Slightly smaller for dense info
    base: moderateScale(15), // Standard iOS body size
    lg: moderateScale(17),
    xl: moderateScale(20),
    '2xl': moderateScale(22),
    '3xl': moderateScale(28),
    '4xl': moderateScale(34),
    '5xl': moderateScale(40),
  },
  
  // Responsive line heights
  lineHeight: {
    xs: moderateScale(16),
    sm: moderateScale(18),
    base: moderateScale(22),
    lg: moderateScale(24),
    xl: moderateScale(28),
    '2xl': moderateScale(30),
    '3xl': moderateScale(34),
    '4xl': moderateScale(41),
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
      minHeight: verticalScale(32),
    },
    medium: {
      paddingHorizontal: scale(16),
      paddingVertical: scale(12),
      minHeight: verticalScale(44),
    },
    large: {
      paddingHorizontal: scale(20),
      paddingVertical: scale(16),
      minHeight: verticalScale(50),
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
    height: verticalScale(40),
    paddingHorizontal: scale(12),
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
    borderRadius: scale(24),
    padding: scale(24),
  },
};

// Component-specific styles with responsive sizing
export const Components = {
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentSizes.card.padding,
    minHeight: ComponentSizes.card.minHeight,
    ...Shadows.md,
  },
  
  button: {
    primary: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.full,
      ...ComponentSizes.button.medium,
    },
    secondary: {
      backgroundColor: Colors.white,
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.full,
      ...ComponentSizes.button.medium,
    },
    small: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.full,
      ...ComponentSizes.button.small,
    },
    large: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.full,
      ...ComponentSizes.button.large,
    },
  },
  
  input: {
    backgroundColor: Colors.gray100,
    borderColor: 'transparent',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    ...ComponentSizes.input.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  
  searchBar: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
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
