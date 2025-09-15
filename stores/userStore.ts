import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { AuthState, OnboardingState, User } from '../types/user';

interface UserStore {
  // State
  authState: AuthState;
  
  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeWelcome: () => void;
  completeProfile: (interests: string[]) => void;
  isOnboardingComplete: () => boolean;
  
  // Internal actions
  setAuthState: (authState: AuthState) => void;
  setLoading: (isLoading: boolean) => void;
  handleUserSession: (supabaseUser: any) => Promise<void>;
  checkSession: () => Promise<void>;
  initializeAuth: () => Promise<() => void>;
}

const initialOnboardingState: OnboardingState = {
  hasCompletedWelcome: false,
  isSignedIn: false,
  hasCompletedProfile: false,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
  // Initial state
  authState: {
    user: null,
    isLoading: true,
    onboardingState: initialOnboardingState,
  },

  // Actions
  setAuthState: (authState: AuthState) => set({ authState }),
  
  setLoading: (isLoading: boolean) => 
    set((state) => ({ 
      authState: { ...state.authState, isLoading } 
    })),

  checkSession: async () => {
    try {
      console.log('Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('Found active session:', session.user.email);
        await get().handleUserSession(session.user);
      } else {
        console.log('No active session found');
        // Check if we have persisted user data
        const currentState = get().authState;
        if (currentState.user && currentState.onboardingState.isSignedIn) {
          console.log('Found persisted user data, but no active session');
          console.log('Session expired, user needs to sign in again');
        }
        get().setLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      get().setLoading(false);
    }
  },

  handleUserSession: async (supabaseUser: any) => {
    try {
      console.log('Starting user session processing...');
      console.log('Supabase user data:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        metadata: supabaseUser.user_metadata
      });

      // Check if user profile exists in our users table
      console.log('Checking if user profile exists in database...');
      console.log('Current session check...');
      
      // Add timeout to prevent infinite hanging
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
      );
      
      let existingUser = null;
      let error = null;
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        existingUser = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        console.log('Database query timed out after 10 seconds');
        error = timeoutError;
      }

      console.log('Database query result:', {
        existingUser: !!existingUser,
        error: error ? error.message : 'none',
        errorCode: error?.code
      });

      let user: User;

      // If database query times out or fails, create user from session data
      if (error && (error.message.includes('timeout') || error instanceof Error)) {
        console.log('Database query timed out, creating user from session data');
        user = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          displayName: supabaseUser.user_metadata?.full_name || 
                       supabaseUser.user_metadata?.name || 
                       supabaseUser.email?.split('@')[0] || 
                       'User',
          interests: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('Created user from session data:', user.displayName);
      } else if (existingUser && !error) {
        console.log('Existing user found, using existing profile - skipping onboarding');
        // User exists, use their data
        user = {
          id: existingUser.id,
          email: existingUser.email,
          displayName: existingUser.display_name,
          avatarUrl: existingUser.avatar_url,
          interests: [],
          createdAt: new Date(existingUser.created_at),
          updatedAt: new Date(existingUser.updated_at),
        };
        console.log('Loaded returning user:', user.displayName);
      } else {
        console.log('New user detected, creating profile...');
        // New user, create profile
        const newUser = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          display_name: supabaseUser.user_metadata?.full_name || 
                       supabaseUser.user_metadata?.name || 
                       supabaseUser.email?.split('@')[0] || 
                       'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
        };

        console.log('Inserting new user profile:', newUser);
        
        // Add timeout for insert operation
        const insertPromise = supabase
          .from('users')
          .insert([newUser]);
          
        const insertTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('User insert timeout after 10 seconds')), 10000)
        );
        
        let insertError = null;
        try {
          const insertResult = await Promise.race([insertPromise, insertTimeoutPromise]) as any;
          insertError = insertResult.error;
        } catch (timeoutError: any) {
          console.log('Database insert timed out after 10 seconds');
          insertError = timeoutError;
        }

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          console.error('Insert error details:', JSON.stringify(insertError, null, 2));
          
          if (insertError.message && insertError.message.includes('timeout')) {
            console.log('Database insert timed out, continuing without database storage');
          }
        } else {
          console.log('User profile created successfully:', newUser.display_name);
        }

        user = {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.display_name,
          interests: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('Created new user object:', user.displayName);
      }

      console.log('Setting final auth state...');
      console.log('Auth state data:', {
        userDisplayName: user.displayName,
        hasCompletedProfile: !!existingUser,
        isExistingUser: !!existingUser
      });

      // Detect truly new users vs returning users
      // A user is "new" if they were created very recently (within last 30 seconds)
      const userCreatedAt = new Date(supabaseUser.created_at);
      const now = new Date();
      const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
      const isNewUser = timeSinceCreation < 30000; // Less than 30 seconds = new user
      const isReturningUser = !isNewUser;
      
      console.log('User creation analysis:', {
        createdAt: userCreatedAt.toISOString(),
        timeSinceCreation: `${Math.round(timeSinceCreation / 1000)}s ago`,
        isNewUser,
        isReturningUser,
        existingUserFound: !!existingUser
      });
      
      const onboardingState = isReturningUser ? {
        hasCompletedWelcome: true,
        isSignedIn: true,
        hasCompletedProfile: true, // Returning users skip all onboarding
      } : {
        hasCompletedWelcome: false, // New users need to go through welcome
        isSignedIn: true,
        hasCompletedProfile: false, // New users need to complete profile
      };
      
      console.log(isReturningUser ? 'Returning user - skipping all onboarding' : 'New user - requires onboarding');

      set({
        authState: {
          user,
          isLoading: false,
          onboardingState
        }
      });

      console.log('User session processing completed successfully');
      get().setLoading(false);
      console.log('User is now signed in:', user.email);
    } catch (error: any) {
      console.error('Error handling user session:', error);
      console.error('Session error stack:', error.stack);
      
      // Don't let timeout errors prevent sign-in completion
      if (error.message && error.message.includes('timeout')) {
        console.log('Database timeout occurred, but user session is still valid');
        console.log('Continuing with sign-in process...');
        get().setLoading(false);
        return; // Don't throw, just return successfully
      }
      
      get().setLoading(false);
      throw error;
    }
  },

  signInWithGoogle: async () => {
    get().setLoading(true);
    
    try {
      console.log('Google sign-in initiated (in-app browser)');
      
      // Configure WebBrowser for better UX
      WebBrowser.maybeCompleteAuthSession();
      
      // Get OAuth URL from Supabase
      console.log('Requesting OAuth URL from Supabase...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'sidequest://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data?.url) {
        console.error('No OAuth URL received from Supabase');
        console.error('Data received:', JSON.stringify(data, null, 2));
        throw new Error('No OAuth URL received from Supabase');
      }

      console.log('OAuth URL generated successfully');
      console.log('OAuth URL preview:', data.url.substring(0, 150) + '...');
      console.log('Opening in-app browser...');
      
      // Open OAuth URL in in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'sidequest://auth/callback',
        {
          showInRecents: false, // Don't show in recent apps
          preferEphemeralSession: true, // Don't save cookies/session
        }
      );

      console.log('WebBrowser result type:', result.type);
      console.log('WebBrowser full result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        console.log('OAuth completed successfully');
        console.log('Full callback URL:', result.url);
        
        // Extract tokens from callback URL
        const url = result.url;
        console.log('Checking for access token in URL...');
        
        if (url.includes('#access_token=')) {
          console.log('Access token found in URL');
          const hashFragment = url.split('#')[1];
          console.log('Hash fragment:', hashFragment);
          
          const params = new URLSearchParams(hashFragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          console.log('Access token:', accessToken ? 'Present' : 'Missing');
          console.log('Refresh token:', refreshToken ? 'Present' : 'Missing');
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              console.error('Session error details:', JSON.stringify(sessionError, null, 2));
              throw sessionError;
            } else {
              console.log('Session set successfully!');
              console.log('User email:', sessionData.user?.email);
              console.log('User ID:', sessionData.user?.id);
              // Loading will be set to false by onAuthStateChange
            }
          } else {
            console.error('Missing tokens in callback URL');
            throw new Error('Missing access or refresh token in callback');
          }
        } else if (url.includes('?access_token=') || url.includes('&access_token=')) {
          console.log('Access token found in query parameters');
          const urlObj = new URL(url);
          const accessToken = urlObj.searchParams.get('access_token');
          const refreshToken = urlObj.searchParams.get('refresh_token');
          
          console.log('Access token:', accessToken ? 'Present' : 'Missing');
          console.log('Refresh token:', refreshToken ? 'Present' : 'Missing');
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              throw sessionError;
            } else {
              console.log('Session set successfully!');
              console.log('User email:', sessionData.user?.email);
            }
          } else {
            throw new Error('Missing access or refresh token in query parameters');
          }
        } else {
          // Surface Supabase auth errors from query params to avoid misleading token errors
          try {
            const urlObj = new URL(url);
            const err = urlObj.searchParams.get('error');
            const errCode = urlObj.searchParams.get('error_code');
            const errDesc = urlObj.searchParams.get('error_description');
            if (err || errCode || errDesc) {
              const message = `OAuth error: ${err || ''} ${errCode || ''} ${errDesc || ''}`.trim();
              console.error(message);
              throw new Error(message);
            }
          } catch {}
          console.error('No access token found in callback URL');
          console.error('Callback URL format:', url);
          throw new Error('No access token found in callback URL');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled OAuth');
        get().setLoading(false);
        return; // Don't show error for user cancellation
      } else if (result.type === 'dismiss') {
        console.log('User dismissed OAuth');
        get().setLoading(false);
        return; // Don't show error for user dismissal
      } else {
        console.error('Unexpected WebBrowser result type:', result.type);
        throw new Error(`OAuth authentication failed: ${result.type}`);
      }
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      console.error('Error stack:', error.stack);
      get().setLoading(false);
      
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      if (error?.message) {
        errorMessage = `Google Sign-In Error: ${error.message}`;
      }
      
      Alert.alert('Sign In Error', errorMessage);
      throw error;
    }
  },

  // Email sign-in helpers
  signInWithEmail: async (email: string, password: string) => {
    get().setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will handle session
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      Alert.alert('Sign In Error', error.message || 'Failed to sign in.');
      get().setLoading(false);
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    get().setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert('Check your email', 'We sent you a confirmation link.');
      get().setLoading(false);
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      Alert.alert('Sign Up Error', error.message || 'Failed to sign up.');
      get().setLoading(false);
      throw error;
    }
  },

  // Passwordless magic link
  signInWithMagicLink: async (email: string) => {
    try {
      get().setLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'sidequest://auth/callback',
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      Alert.alert('Check your email', 'We sent you a sign-in link. Open it on this device to continue.');
      get().setLoading(false);
    } catch (error: any) {
      console.error('Magic link error:', error);
      Alert.alert('Magic Link Error', error.message || 'Failed to send magic link.');
      get().setLoading(false);
      throw error;
    }
  },

  // OTP Code-based authentication
  signInWithOTP: async (email: string) => {
    try {
      get().setLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      console.log('OTP sent successfully to:', email);
      get().setLoading(false);
    } catch (error: any) {
      console.error('OTP send error:', error);
      get().setLoading(false);
      throw error;
    }
  },

  verifyOTP: async (email: string, token: string) => {
    try {
      get().setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
      console.log('OTP verified successfully for:', email);
      // The auth state change will be handled by the listener
      get().setLoading(false);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      get().setLoading(false);
      throw error;
    }
  },

  signInWithApple: async () => {
    get().setLoading(true);
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          throw error;
        }
        
        // Auth state will be handled by the onAuthStateChange listener
      } else {
        throw new Error('No identity token received from Apple');
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      get().setLoading(false);
      
      // Handle user cancellation
      if (error.code === 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Cancelled', 'Apple sign-in was cancelled.');
      } else {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      // Auth state will be handled by the onAuthStateChange listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { authState } = get();
    if (!authState.user) return;
    
    try {
      console.log('Updating user profile:', updates);
      
      // Prepare update object for Supabase
      const supabaseUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      
      // Add display name if provided
      if (updates.displayName !== undefined) {
        supabaseUpdates.display_name = updates.displayName;
      }
      
      // Add avatar URL if provided
      if (updates.avatarUrl !== undefined) {
        supabaseUpdates.avatar_url = updates.avatarUrl;
      }
      
      console.log('📤 Sending to Supabase:', supabaseUpdates);
      
      // Update in Supabase database
      const { error } = await supabase
        .from('users')
        .update(supabaseUpdates)
        .eq('id', authState.user.id);

      if (error) {
        console.error('❌ Supabase update error:', error);
        Alert.alert('Update Failed', 'Failed to update profile. Please try again.');
        return;
      }
      
      console.log('Profile updated in Supabase successfully');

      // Update local state
      set((state) => ({
        authState: {
          ...state.authState,
          user: {
            ...state.authState.user!,
            ...updates,
            updatedAt: new Date(),
          }
        }
      }));
      
      console.log('Local state updated successfully');
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Update Failed', 'Failed to update profile. Please try again.');
    }
  },

  completeWelcome: () => {
    set((state) => ({
      authState: {
        ...state.authState,
        onboardingState: {
          ...state.authState.onboardingState,
          hasCompletedWelcome: true,
        }
      }
    }));
  },

  completeProfile: (interests: string[]) => {
    get().updateProfile({ interests });
    set((state) => ({
      authState: {
        ...state.authState,
        onboardingState: {
          ...state.authState.onboardingState,
          hasCompletedProfile: true,
        }
      }
    }));
  },

  isOnboardingComplete: () => {
    const { onboardingState } = get().authState;
    return (
      onboardingState.hasCompletedWelcome &&
      onboardingState.isSignedIn &&
      onboardingState.hasCompletedProfile
    );
  },

  initializeAuth: async () => {
    console.log('Initializing auth...');
    
    // Check for existing session on app start
    await get().checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      console.log('Session exists:', !!session);
      console.log('User ID:', session?.user?.id);
      console.log('User email:', session?.user?.email);
      
      if (session?.user) {
        console.log('Processing user session...');
        await get().handleUserSession(session.user);
      } else {
        console.log('No session, clearing auth state');
        set({
          authState: {
            user: null,
            isLoading: false,
            onboardingState: initialOnboardingState,
          }
        });
      }
    });

    // Note: Deep link handling is no longer needed with in-app browser OAuth
    // The WebBrowser handles the OAuth flow entirely within the app

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        authState: {
          ...state.authState,
          isLoading: false, // Don't persist loading state
        },
      }),
    }
  )
);
