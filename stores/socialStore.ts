import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

interface SocialStore {
  // State
  userCircles: FriendCircle[];
  currentCircle: FriendCircle | null;
  circleMembers: CircleMember[];
  circleSidequests: SocialSidequest[];
  activityFeed: ActivityFeedItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentCircle: (circle: FriendCircle | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Circle Management
  createCircle: (name: string, description?: string, userId?: string) => Promise<FriendCircle>;
  joinCircle: (code: string, userId?: string) => Promise<FriendCircle>;
  leaveCircle: (circleId: string, userId: string) => Promise<void>;
  generateNewCode: (circleId: string, userId: string) => Promise<string>;
  loadUserCircles: (userId: string) => Promise<void>;

  // Circle Members
  loadCircleMembers: (circleId: string) => Promise<void>;

  // Social Sidequests
  loadCircleSidequests: (circleId: string) => Promise<void>;
  createSocialSidequest: (sidequest: Partial<SocialSidequest> & { created_by?: string }) => Promise<SocialSidequest>;
  updateSidequestStatus: (sidequestId: string, status: SocialSidequest['status']) => Promise<void>;

  // Activity Feed
  loadActivityFeed: (circleId: string) => Promise<void>;

  // Utility
  generateCircleCode: () => string;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  // Initial state
  userCircles: [],
  currentCircle: null,
  circleMembers: [],
  circleSidequests: [],
  activityFeed: [],
  isLoading: false,
  error: null,

  // Basic setters
  setCurrentCircle: (circle: FriendCircle | null) => set({ currentCircle: circle }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // Generate a unique 6-character code
  generateCircleCode: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Load user's circles
  loadUserCircles: async (userId: string) => {
    try {
      get().setLoading(true);
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
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const circles = (data || []).map((item: any) => item.friend_circles).filter(Boolean) as FriendCircle[];
      set({ userCircles: circles });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load circles');
    } finally {
      get().setLoading(false);
    }
  },

  // Create a new friend circle
  createCircle: async (name: string, description?: string, userId?: string): Promise<FriendCircle> => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      get().setLoading(true);
      const code = get().generateCircleCode();
      console.log('[SocialStore.createCircle] Input', {
        ts: new Date().toISOString(),
        name,
        description,
        userId,
        generatedCode: code,
      });

      // Create the circle
      const { data: circle, error: circleError } = await supabase
        .from('friend_circles')
        .insert({
          name,
          code,
          description,
          created_by: userId,
        })
        .select()
        .single();

      if (circleError) {
        console.error('[SocialStore.createCircle] Supabase insert error', {
          code: (circleError as any)?.code,
          message: circleError.message,
          details: (circleError as any)?.details,
          hint: (circleError as any)?.hint,
          status: (circleError as any)?.status,
        });
        throw circleError;
      }

      console.log('[SocialStore.createCircle] Inserted circle', circle);

      // Reload user circles and set current circle
      await get().loadUserCircles(userId);
      set({ currentCircle: circle });
      console.log('[SocialStore.createCircle] Current circle set and user circles reloaded');
      return circle;
    } catch (err) {
      try {
        console.error('[SocialStore.createCircle] Caught error', err);
      } catch {}
      get().setError(err instanceof Error ? err.message : 'Failed to create circle');
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  // Join a circle with secret code
  joinCircle: async (code: string, userId?: string): Promise<FriendCircle> => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      get().setLoading(true);

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
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this circle');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: userId,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Reload user circles and set current circle
      await get().loadUserCircles(userId);
      set({ currentCircle: circle });
      return circle;
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to join circle');
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  // Leave a circle
  leaveCircle: async (circleId: string, userId: string): Promise<void> => {
    try {
      get().setLoading(true);

      const { error } = await supabase
        .from('circle_members')
        .update({ is_active: false })
        .eq('circle_id', circleId)
        .eq('user_id', userId);

      if (error) throw error;

      const { currentCircle } = get();
      if (currentCircle?.id === circleId) {
        get().setCurrentCircle(null);
      }
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to leave circle');
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  // Generate new circle code
  generateNewCode: async (circleId: string, userId: string): Promise<string> => {
    try {
      get().setLoading(true);
      const newCode = get().generateCircleCode();

      const { error } = await supabase
        .from('friend_circles')
        .update({ code: newCode })
        .eq('id', circleId)
        .eq('created_by', userId);

      if (error) throw error;

      return newCode;
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to generate new code');
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  // Load circle members
  loadCircleMembers: async (circleId: string): Promise<void> => {
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
      set({ circleMembers: data || [] });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  },

  // Load circle sidequests
  loadCircleSidequests: async (circleId: string): Promise<void> => {
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
      set({ circleSidequests: data || [] });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load sidequests');
    }
  },

  // Create social sidequest
  createSocialSidequest: async (sidequest: Partial<SocialSidequest> & { created_by?: string }): Promise<SocialSidequest> => {
    try {
      const { data, error } = await supabase
        .from('social_sidequests')
        .insert({
          ...sidequest,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload sidequests
      if (sidequest.circle_id) {
        await get().loadCircleSidequests(sidequest.circle_id);
      }

      return data;
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to create sidequest');
      throw err;
    }
  },

  // Update sidequest status
  updateSidequestStatus: async (sidequestId: string, status: SocialSidequest['status']): Promise<void> => {
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
      const { currentCircle } = get();
      if (currentCircle) {
        await get().loadCircleSidequests(currentCircle.id);
      }
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to update sidequest');
      throw err;
    }
  },

  // Load activity feed
  loadActivityFeed: async (circleId: string): Promise<void> => {
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
      set({ activityFeed: data || [] });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load activity feed');
    }
  },
}));
