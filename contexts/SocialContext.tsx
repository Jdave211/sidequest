import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

interface FriendCircle {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_members?: number;
  member_count?: number;
}

interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_active: boolean;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface SocialSidequest {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'not_started' | 'in_progress' | 'completed';
  created_by: string;
  circle_id?: string;
  visibility: 'private' | 'circle' | 'public';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  creator?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface ActivityFeedItem {
  id: string;
  sidequest_id: string;
  user_id: string;
  activity_type: 'created' | 'started' | 'updated' | 'completed' | 'commented';
  description?: string;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
  sidequest?: {
    title: string;
    category: string;
  };
}

interface SocialContextType {
  // Friend Circles
  userCircles: FriendCircle[];
  currentCircle: FriendCircle | null;
  setCurrentCircle: (circle: FriendCircle | null) => void;
  
  // Circle Management
  createCircle: (name: string, description?: string) => Promise<FriendCircle>;
  joinCircle: (code: string) => Promise<FriendCircle>;
  leaveCircle: (circleId: string) => Promise<void>;
  generateNewCode: (circleId: string) => Promise<string>;
  
  // Circle Members
  circleMembers: CircleMember[];
  loadCircleMembers: (circleId: string) => Promise<void>;
  
  // Social Sidequests
  circleSidequests: SocialSidequest[];
  loadCircleSidequests: (circleId: string) => Promise<void>;
  createSocialSidequest: (sidequest: Partial<SocialSidequest>) => Promise<SocialSidequest>;
  updateSidequestStatus: (sidequestId: string, status: SocialSidequest['status']) => Promise<void>;
  
  // Activity Feed
  activityFeed: ActivityFeedItem[];
  loadActivityFeed: (circleId: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useUser();
  const [userCircles, setUserCircles] = useState<FriendCircle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<FriendCircle | null>(null);
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleSidequests, setCircleSidequests] = useState<SocialSidequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a unique 6-character code
  const generateCircleCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load user's circles
  const loadUserCircles = async () => {
    if (!authState.user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle_id,
          friend_circles (
            id,
            name,
            code,
            description,
            created_by,
            created_at,
            updated_at,
            is_active,
            max_members
          )
        `)
        .eq('user_id', authState.user.id)
        .eq('is_active', true);

      if (error) throw error;

      const circles = (data || []).map((item: any) => item.friend_circles).filter(Boolean) as FriendCircle[];
      setUserCircles(circles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load circles');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new friend circle
  const createCircle = async (name: string, description?: string): Promise<FriendCircle> => {
    if (!authState.user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const code = generateCircleCode();

      // Create the circle
      const { data: circle, error: circleError } = await supabase
        .from('friend_circles')
        .insert({
          name,
          code,
          description,
          created_by: authState.user.id,
        })
        .select()
        .single();

      if (circleError) throw circleError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: authState.user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      await loadUserCircles();
      return circle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create circle');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Join a circle with secret code
  const joinCircle = async (code: string): Promise<FriendCircle> => {
    if (!authState.user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);

      // Find circle by code
      const { data: circle, error: findError } = await supabase
        .from('friend_circles')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (findError || !circle) throw new Error('Invalid circle code');

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circle.id)
        .eq('user_id', authState.user.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this circle');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: authState.user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      await loadUserCircles();
      return circle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join circle');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Leave a circle
  const leaveCircle = async (circleId: string): Promise<void> => {
    if (!authState.user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('circle_members')
        .update({ is_active: false })
        .eq('circle_id', circleId)
        .eq('user_id', authState.user.id);

      if (error) throw error;

      await loadUserCircles();
      if (currentCircle?.id === circleId) {
        setCurrentCircle(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave circle');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new circle code
  const generateNewCode = async (circleId: string): Promise<string> => {
    if (!authState.user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      const newCode = generateCircleCode();

      const { error } = await supabase
        .from('friend_circles')
        .update({ code: newCode })
        .eq('id', circleId)
        .eq('created_by', authState.user.id);

      if (error) throw error;

      await loadUserCircles();
      return newCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate new code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load circle members
  const loadCircleMembers = async (circleId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          *,
          users (
            display_name,
            avatar_url
          )
        `)
        .eq('circle_id', circleId)
        .eq('is_active', true);

      if (error) throw error;
      setCircleMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  };

  // Load circle sidequests
  const loadCircleSidequests = async (circleId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('social_sidequests')
        .select(`
          *,
          users (
            display_name,
            avatar_url
          )
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCircleSidequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sidequests');
    }
  };

  // Create social sidequest
  const createSocialSidequest = async (sidequest: Partial<SocialSidequest>): Promise<SocialSidequest> => {
    if (!authState.user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('social_sidequests')
        .insert({
          ...sidequest,
          created_by: authState.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload sidequests
      if (sidequest.circle_id) {
        await loadCircleSidequests(sidequest.circle_id);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sidequest');
      throw err;
    }
  };

  // Update sidequest status
  const updateSidequestStatus = async (sidequestId: string, status: SocialSidequest['status']): Promise<void> => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('social_sidequests')
        .update(updateData)
        .eq('id', sidequestId);

      if (error) throw error;

      // Reload current circle sidequests
      if (currentCircle) {
        await loadCircleSidequests(currentCircle.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sidequest');
      throw err;
    }
  };

  // Load activity feed
  const loadActivityFeed = async (circleId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('sidequest_activities')
        .select(`
          *,
          users (
            display_name,
            avatar_url
          ),
          social_sidequests (
            title,
            category
          )
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityFeed(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity feed');
    }
  };

  // Load user circles when user changes
  useEffect(() => {
    if (authState.user) {
      loadUserCircles();
    } else {
      setUserCircles([]);
      setCurrentCircle(null);
    }
  }, [authState.user]);

  const value: SocialContextType = {
    userCircles,
    currentCircle,
    setCurrentCircle,
    createCircle,
    joinCircle,
    leaveCircle,
    generateNewCode,
    circleMembers,
    loadCircleMembers,
    circleSidequests,
    loadCircleSidequests,
    createSocialSidequest,
    updateSidequestStatus,
    activityFeed,
    loadActivityFeed,
    isLoading,
    error,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}; 