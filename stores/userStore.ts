import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AuthState, OnboardingState, User } from '../types/user';

interface UserStore {
  // State
  authState: AuthState;
  
  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
  initializeAuth: () => void;
}

const initialOnboardingState: OnboardingState = {
  hasCompletedWelcome: false,
  isSignedIn: false,
  hasCompletedProfile: false,
};

export const useUserStore = create<UserStore>((set, get) => ({
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await get().handleUserSession(session.user);
      } else {
        get().setLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      get().setLoading(false);
    }
  },

  handleUserSession: async (supabaseUser: any) => {
    try {
      // Check if user profile exists in our users table
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      let user: User;

      if (existingUser && !error) {
        // User exists, use their data
        user = {
          id: existingUser.id,
          email: existingUser.email,
          displayName: existingUser.display_name,
          interests: [],
          createdAt: new Date(existingUser.created_at),
          updatedAt: new Date(existingUser.updated_at),
        };
      } else {
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

        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser]);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
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
      }

      console.log('Setting auth state:', {
        user: user.displayName,
        hasCompletedProfile: !!existingUser,
        existingUser: !!existingUser
      });

      set({
        authState: {
          user,
          isLoading: false,
          onboardingState: {
            hasCompletedWelcome: true,
            isSignedIn: true,
            hasCompletedProfile: !!existingUser,
          }
        }
      });
    } catch (error) {
      console.error('Error handling user session:', error);
      get().setLoading(false);
    }
  },

  signInWithGoogle: async () => {
    get().setLoading(true);
    
    try {
      console.log('🔐 Google sign-in initiated (in-app browser)');
      
      // Configure WebBrowser for better UX
      WebBrowser.maybeCompleteAuthSession();
      
      // Get OAuth URL from Supabase
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
        console.error('❌ Supabase OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL received from Supabase');
      }

      console.log('✅ OAuth URL generated, opening in-app browser...');
      
      // Open OAuth URL in in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'sidequest://auth/callback',
        {
          showInRecents: false, // Don't show in recent apps
          preferEphemeralSession: true, // Don't save cookies/session
        }
      );

      console.log('🔄 WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('✅ OAuth completed successfully');
        console.log('🔗 Callback URL:', result.url);
        
        // Extract tokens from callback URL
        const url = result.url;
        if (url.includes('#access_token=')) {
          const hashFragment = url.split('#')[1];
          const params = new URLSearchParams(hashFragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('🔑 Setting session with tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError);
              throw sessionError;
            } else {
              console.log('✅ Session set successfully:', sessionData.user?.email);
            }
          }
        }
      } else if (result.type === 'cancel') {
        console.log('🚫 User cancelled OAuth');
        get().setLoading(false);
        return; // Don't show error for user cancellation
      } else {
        throw new Error('OAuth authentication failed');
      }
      
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      get().setLoading(false);
      
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      if (error?.message) {
        errorMessage = `Google Sign-In Error: ${error.message}`;
      }
      
      Alert.alert('Sign In Error', errorMessage);
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
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          display_name: updates.displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authState.user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

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
    } catch (error) {
      console.error('Error updating profile:', error);
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

  initializeAuth: () => {
    // Check for existing session on app start
    get().checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event);
      console.log('👤 Session exists:', !!session);
      console.log('🆔 User ID:', session?.user?.id);
      console.log('📧 User email:', session?.user?.email);
      
      if (session?.user) {
        console.log('✅ Processing user session...');
        await get().handleUserSession(session.user);
      } else {
        console.log('❌ No session, clearing auth state');
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
  },
}));
