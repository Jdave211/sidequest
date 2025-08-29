import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { AuthState, OnboardingState, User } from '../types/user';

interface UserContextType {
  authState: AuthState;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
  completeWelcome: () => void;
  completeProfile: (interests: string[]) => void;
  isOnboardingComplete: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const initialOnboardingState: OnboardingState = {
  hasCompletedWelcome: false,
  isSignedIn: false,
  hasCompletedProfile: false,
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    onboardingState: initialOnboardingState,
  });

  useEffect(() => {
    // Check for existing session on app start
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      console.log('Session exists:', !!session);
      console.log('User ID:', session?.user?.id);
      
      if (session?.user) {
        console.log('Processing user session...');
        await handleUserSession(session.user);
      } else {
        console.log('No session, clearing auth state');
        setAuthState({
          user: null,
          isLoading: false,
          onboardingState: initialOnboardingState,
        });
      }
    });

    // Handle deep link for OAuth callback
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if this is an OAuth callback with tokens
      if (url.includes('#access_token=')) {
        console.log('Processing OAuth callback manually...');
        try {
          // Extract the hash fragment with tokens
          const hashFragment = url.split('#')[1];
          const params = new URLSearchParams(hashFragment);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('Session set successfully:', data.user?.email);
            }
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
        }
      }
    };

    // Listen for incoming deep links
    const subscription2 = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      subscription2?.remove();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleUserSession = async (supabaseUser: any) => {
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

      setAuthState({
        user,
        isLoading: false,
        onboardingState: {
          hasCompletedWelcome: true,
          isSignedIn: true,
          hasCompletedProfile: !!existingUser,
        }
      });
    } catch (error) {
      console.error('Error handling user session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signInWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      const redirectUrl = isExpoGo ? Linking.createURL('/auth/callback') : 'sidequest://auth/callback';
      console.log('Google sign-in redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log('OAuth initiated, data:', data);
      
      // For web or if URL is provided, open the auth URL
      if (data?.url) {
        await Linking.openURL(data.url);
      }
      
      // Auth state will be handled by the onAuthStateChange listener
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Sign In Error', 'Failed to sign in with Google. Please try again.');
      throw error;
    }
  };

  const signInWithApple = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
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
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Handle user cancellation
      if (error.code === 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Cancelled', 'Apple sign-in was cancelled.');
      } else {
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Auth state will be handled by the onAuthStateChange listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
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
      setAuthState(prev => ({
        ...prev,
        user: {
          ...prev.user!,
          ...updates,
          updatedAt: new Date(),
        }
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const completeWelcome = () => {
    setAuthState(prev => ({
      ...prev,
      onboardingState: {
        ...prev.onboardingState,
        hasCompletedWelcome: true,
      }
    }));
  };

  const completeProfile = (interests: string[]) => {
    updateProfile({ interests });
    setAuthState(prev => ({
      ...prev,
      onboardingState: {
        ...prev.onboardingState,
        hasCompletedProfile: true,
      }
    }));
  };

  const isOnboardingComplete = () => {
    const { onboardingState } = authState;
    return (
      onboardingState.hasCompletedWelcome &&
      onboardingState.isSignedIn &&
      onboardingState.hasCompletedProfile
    );
  };

  const value: UserContextType = {
    authState,
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateProfile,
    completeWelcome,
    completeProfile,
    isOnboardingComplete,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
