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
  loadGlobalActivityFeed: (circleIds: string[]) => Promise<void>;

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

  // Generate a unique 6-character code with better distribution
  generateCircleCode: (): string => {
    // Use timestamp-based prefix for better distribution and collision avoidance
    const now = Date.now();
    const timeComponent = now.toString(36).slice(-2).toUpperCase(); // Last 2 chars of timestamp in base36
    
    // High-entropy random component
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomComponent = '';
    for (let i = 0; i < 4; i++) {
      randomComponent += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Combine: 2 chars time + 4 chars random = 6 chars total
    return timeComponent + randomComponent;
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
            max_members,
            member_count
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.warn('[loadActivityFeed] error', error);
        throw error;
      }

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
    
    try {
      get().setLoading(true);
      // Always resolve the user from the active Supabase session to ensure auth.uid() matches
      const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
      if (authUserError) {
        console.error('[SocialStore.createCircle] getUser error', authUserError);
        throw authUserError;
      }
      const effectiveUserId = authUserData?.user?.id;
      if (!effectiveUserId) {
        throw new Error('Not signed in');
      }

      // Generate unique code with collision detection
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        code = get().generateCircleCode();
        attempts++;
        
        // Check if code already exists
        const { data: existingCircle, error: checkError } = await supabase
          .from('friend_circles')
          .select('id')
          .eq('code', code)
          .eq('is_active', true)
          .single();
        
        // If no circle found (PGRST116) or no error, code is unique
        if (checkError?.code === 'PGRST116' || !existingCircle) {
          break; // Code is unique
        }
        
        // If there's a different error, throw it
        if (checkError) {
          throw checkError;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique circle code. Please try again.');
        }
        
        console.log(`[SocialStore.createCircle] Code collision detected (${code}), regenerating... (attempt ${attempts})`);
      } while (attempts < maxAttempts);
      
      console.log('[SocialStore.createCircle] Input', {
        ts: new Date().toISOString(),
        name,
        description,
        userIdParam: userId,
        effectiveUserId,
        generatedCode: code,
        attempts,
      });

      // Create the circle
      const { data: circle, error: circleError } = await supabase
        .from('friend_circles')
        .insert({
          name,
          code,
          description,
          created_by: effectiveUserId,
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
      await get().loadUserCircles(effectiveUserId);
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

  // Join a circle with secret code (optimized with indexed search)
  joinCircle: async (code: string, userId?: string): Promise<FriendCircle> => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      get().setLoading(true);
      
      // Normalize and validate code format
      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        throw new Error('Invalid code format. Code must be 6 characters (letters and numbers only)');
      }

      console.log(`[SocialStore.joinCircle] Searching for circle with code: ${normalizedCode}`);

      // Find circle by code using secure function (prevents seeing all circles)
      const { data: circleData, error: findError } = await supabase
        .rpc('find_circle_by_code', { circle_code: normalizedCode });
      
      const circle = circleData?.[0]; // Function returns array, get first result

      if (findError) {
        console.log(`[SocialStore.joinCircle] Circle lookup error:`, findError);
        if (findError.code === 'PGRST116') { // No rows returned
          throw new Error('Invalid circle code');
        }
        throw findError;
      }
      
      if (!circle) throw new Error('Invalid circle code');

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

      if (error) {
        console.warn('[loadGlobalActivityFeed] error', error);
        throw error;
      }

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

      // Create an activity record for the new sidequest
      try {
        await supabase.from('sidequest_activities').insert({
          sidequest_id: data.id,
          user_id: sidequest.created_by,
          activity_type: 'created' as const,
          description: data.title ? `Created "${data.title}"` : null,
        });
      } catch (e) {
        // Non-fatal: log and continue
        console.warn('[SocialStore.createSocialSidequest] activity insert failed', e);
      }

      // Note: Personal sidequests now load directly from database, no need to sync

      // Reload sidequests and activity feed for the circle
      if (sidequest.circle_id) {
        await Promise.all([
          get().loadCircleSidequests(sidequest.circle_id),
          get().loadActivityFeed(sidequest.circle_id),
        ]);
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
      // Load sidequests first
      const { data: sq, error: sqError } = await supabase
        .from('social_sidequests')
        .select('id, created_at, created_by, title, category')
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sqError) {
        console.warn('[loadActivityFeed] sidequests error', sqError);
        throw sqError;
      }

      // Load user data separately
      const userIds = [...new Set((sq || []).map(s => s.created_by))];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.warn('[loadActivityFeed] users error', usersError);
      }

      // Create user lookup map
      const userMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as any);

      const activities = (sq || []).map((s: any) => ({
        id: `synth-${s.id}`,
        sidequest_id: s.id,
        user_id: s.created_by,
        activity_type: 'created' as const,
        created_at: s.created_at,
        user: userMap[s.created_by] || { display_name: 'Unknown User', avatar_url: null },
        sidequest: { title: s.title, category: s.category },
      }));

      console.log(`[loadActivityFeed] Loaded ${activities.length} activities for circle ${circleId}`);
      set({ activityFeed: activities });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load activity feed');
    }
  },

  // Load activity feed across multiple circles
  loadGlobalActivityFeed: async (circleIds: string[]): Promise<void> => {
    try {
      if (!circleIds || circleIds.length === 0) {
        set({ activityFeed: [] });
        return;
      }
      // Load sidequests first
      const { data: sq, error: sqError } = await supabase
        .from('social_sidequests')
        .select('id, created_at, created_by, title, category, circle_id')
        .in('circle_id', circleIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (sqError) {
        console.warn('[loadGlobalActivityFeed] sidequests error', sqError);
        throw sqError;
      }

      // Load user data separately
      const userIds = [...new Set((sq || []).map(s => s.created_by))];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.warn('[loadGlobalActivityFeed] users error', usersError);
      }

      // Create user lookup map
      const userMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as any);

      const activities = (sq || []).map((s: any) => ({
        id: `synth-${s.id}`,
        sidequest_id: s.id,
        user_id: s.created_by,
        activity_type: 'created' as const,
        created_at: s.created_at,
        circle_id: s.circle_id,
        user: userMap[s.created_by] || { display_name: 'Unknown User', avatar_url: null },
        sidequest: { title: s.title, category: s.category },
      }));

      console.log(`[loadGlobalActivityFeed] Loaded ${activities.length} activities for ${circleIds.length} circles`);
      set({ activityFeed: activities });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load activity feed');
    }
  },
}));