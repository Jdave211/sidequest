export interface User {
  id: string;
  email: string;
  displayName: string;
  interests: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
  };
  groupCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingState {
  hasCompletedWelcome: boolean;
  isSignedIn: boolean;
  hasCompletedProfile: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  onboardingState: OnboardingState;
}

export const INTEREST_OPTIONS = [
  'Adventure',
  'Arts & Crafts',
  'Cooking',
  'Fitness',
  'Gaming',
  'Learning',
  'Music',
  'Nature',
  'Photography',
  'Reading',
  'Social',
  'Sports',
  'Technology',
  'Travel',
  'Writing'
] as const;

export type Interest = typeof INTEREST_OPTIONS[number]; 