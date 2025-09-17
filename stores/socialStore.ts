import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Module-level helpers: cache + inflight + background refetch
const inflight = new Map<string, Promise<unknown>>();
let bgInterval: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;
let currentUserId: string | undefined;

const cacheKeyCircles = (userId: string) => `cache:user_circles:${userId}`;
const cacheKeyActivity = (circleId: string) => `cache:activity:${circleId}`;
async function saveCache(key: string, value: unknown) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}
async function loadCache<T>(key: string): Promise<T | null> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}

interface FriendCircle {
  id: string;
  name: string;
  code: string;
  description?: string;
  display_picture?: string;
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
  review?: string;
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
  image_urls?: string[] | null;
  review?: string | null;
  location?: string | null;
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
  deleteSpace: (spaceId: string) => Promise<void>;
  generateNewCode: (circleId: string, userId: string) => Promise<string>;
  loadUserCircles: (userId: string) => Promise<void>;

  // Circle Members
  loadCircleMembers: (circleId: string) => Promise<void>;

  // Social Sidequests (now backed by sidequest_activities)
  loadCircleSidequests: (circleId: string) => Promise<void>;
  createSocialSidequest: (sidequest: Partial<SocialSidequest> & { created_by?: string }, extra?: { image_urls?: string[]; location?: string }) => Promise<{ id: string }>;
  updateSidequestStatus: (sidequestId: string, status: SocialSidequest['status']) => Promise<void>;

  // Activity Feed
  loadActivityFeed: (circleId: string) => Promise<void>;
  loadGlobalActivityFeed: (circleIds: string[]) => Promise<void>;

  // Utility
  generateCircleCode: () => string;
  // Data layer lifecycle
  initDataLayer: (userId: string) => Promise<void>;
  teardownDataLayer: () => void;
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

  // Initialize background refresh + hydrate from cache
  initDataLayer: async (userId: string) => {
    currentUserId = userId;
    // Rehydrate cached circles for instant UI
    const cachedCircles = await loadCache<FriendCircle[]>(cacheKeyCircles(userId));
    if (cachedCircles && cachedCircles.length > 0) {
      set({ userCircles: cachedCircles });
    }
    // Fetch fresh data in background
    await get().loadUserCircles(userId);

    // Periodic background refetch
    if (!bgInterval) {
      bgInterval = setInterval(() => {
        if (!currentUserId) return;
        get().loadUserCircles(currentUserId);
        const circle = get().currentCircle;
        if (circle) get().loadActivityFeed(circle.id);
      }, 30000); // 30s
    }
    // Refetch on foreground
    if (!appStateSub) {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active' && currentUserId) {
          get().loadUserCircles(currentUserId);
          const circle = get().currentCircle;
          if (circle) get().loadActivityFeed(circle.id);
        }
      });
      appStateSub = { remove: () => sub.remove() };
    }
  },

  teardownDataLayer: () => {
    if (bgInterval) { clearInterval(bgInterval); bgInterval = null; }
    if (appStateSub) { appStateSub.remove(); appStateSub = null; }
    currentUserId = undefined;
  },

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
      // Deduplicate concurrent requests
      const key = `loadUserCircles:${userId}`;
      const existing = inflight.get(key);
      if (existing) { await existing; return; }

      // Show loader only if there is nothing to show yet
      const shouldShowLoader = get().userCircles.length === 0;
      if (shouldShowLoader) get().setLoading(true);

      const p = (async () => {
        const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle_id,
          friend_circles (
            id,
            name,
            code,
            description,
            display_picture,
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
          console.warn('[loadUserCircles] error', error);
          throw error;
        }

        const circles = (data || []).map((item: any) => item.friend_circles).filter(Boolean) as FriendCircle[];
        set({ userCircles: circles });
        await saveCache(cacheKeyCircles(userId), circles);
      })();

      inflight.set(key, p);
      await p;
      inflight.delete(key);
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load circles');
    } finally {
      get().setLoading(false);
    }
  },

  // Create a new friend circle
  createCircle: async (name: string, description?: string, displayPicture?: string, userId?: string): Promise<FriendCircle> => {
    
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
          display_picture: displayPicture || null,
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

  // Delete a space
  deleteSpace: async (spaceId: string): Promise<void> => {
    try {
      get().setLoading(true);

      // Get space details to check for display picture
      const { data: space, error: spaceError } = await supabase
        .from('friend_circles')
        .select('display_picture')
        .eq('id', spaceId)
        .single();

      if (spaceError) throw spaceError;

      // Delete display picture from storage if it exists
      if (space?.display_picture) {
        const path = space.display_picture.split('/').pop(); // Get filename from URL
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('space-images')
            .remove([path]);
          if (storageError) {
            console.error('[deleteSpace] Failed to delete display picture:', storageError);
            // Continue with space deletion even if image deletion fails
          }
        }
      }

      // Call the delete_space function
      const { error: deleteError } = await supabase
        .rpc('delete_space', { space_id: spaceId });

      if (deleteError) throw deleteError;

      // Update local state
      const { currentCircle, userCircles } = get();
      if (currentCircle?.id === spaceId) {
        get().setCurrentCircle(null);
      }
      set({ userCircles: userCircles.filter(c => c.id !== spaceId) });

    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to delete space');
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
      // Resolve IDs in this circle
      const { data: circle, error: circleError } = await supabase
        .from('friend_circles')
        .select('sidequest_ids')
        .eq('id', circleId)
        .single();

      if (circleError) throw circleError;
      const ids: string[] = Array.isArray(circle?.sidequest_ids) ? circle.sidequest_ids : [];
      if (ids.length === 0) { set({ circleSidequests: [] }); return; }

      const { data: activities, error: activitiesError } = await supabase
        .from('sidequest_activities')
        .select('id, user_id, title, description, category, difficulty, status, review, image_urls, location, created_at, updated_at')
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      set({ circleSidequests: (activities as any) || [] });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load sidequests');
    }
  },

  // Create social sidequest (insert into sidequest_activities and link to circle)
  createSocialSidequest: async (sidequest: Partial<SocialSidequest> & { created_by?: string }, extra?: { image_urls?: string[]; location?: string }): Promise<{ id: string }> => {
    try {
      // Insert activity (this becomes the sidequest itself now)
      const { data: created, error: createError } = await supabase
        .from('sidequest_activities')
        .insert({
          user_id: sidequest.created_by,
          title: sidequest.title,
          description: sidequest.description,
          category: sidequest.category,
          difficulty: sidequest.difficulty,
          status: sidequest.status,
          review: sidequest.review,
          image_urls: extra?.image_urls || null,
          location: extra?.location || null,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Link to circle via RPC using the new id
      if (sidequest.circle_id) {
        const { error: linkError } = await supabase.rpc('add_sidequest_to_circle', {
          circle: sidequest.circle_id,
          sidequest: created.id,
        });
        if (linkError) throw linkError;
      }

      // Refresh lists
      if (sidequest.circle_id) {
        await Promise.all([
          get().loadCircleSidequests(sidequest.circle_id),
          get().loadActivityFeed(sidequest.circle_id),
        ]);
      }

      return { id: created.id };
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to create sidequest');
      throw err;
    }
  },

  // Update sidequest status (on sidequest_activities)
  updateSidequestStatus: async (sidequestId: string, status: SocialSidequest['status']): Promise<void> => {
    try {
      const updateData: any = { status };
      // completed_at not tracked on new schema; rely on status only

      const { error } = await supabase
        .from('sidequest_activities')
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
      const key = `loadActivity:${circleId}`;
      const existing = inflight.get(key);
      if (existing) { await existing; return; }

      const p = (async () => {
      // Get sidequest ids for this circle
      const { data: circle, error: circleError } = await supabase
        .from('friend_circles')
        .select('sidequest_ids')
        .eq('id', circleId)
        .single();

      if (circleError) {
        console.warn('[loadActivityFeed] circle error', circleError);
        throw circleError;
      }

      const ids: string[] = Array.isArray(circle?.sidequest_ids) ? circle.sidequest_ids : [];
      if (ids.length === 0) { set({ activityFeed: [] }); return; }

      // Load activities by ids
      const { data: activities, error: activitiesError } = await supabase
        .from('sidequest_activities')
        .select('id, user_id, description, review, created_at, image_urls, location, title, category, status')
        .in('id', ids)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activitiesError) {
        console.warn('[loadActivityFeed] activities error', activitiesError);
        throw activitiesError;
      }

      // Load user data separately
      const userIds = [...new Set((activities || []).map(a => a.user_id))];
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

      const formattedActivities: ActivityFeedItem[] = (activities || []).map((a: any) => ({
        id: a.id,
        sidequest_id: a.id,
        user_id: a.user_id,
        activity_type: 'created' as const,
        created_at: a.created_at,
        description: a.description,
        review: a.review,
        image_urls: a.image_urls,
        location: a.location,
        user: userMap[a.user_id] || { display_name: 'Unknown User', avatar_url: null },
        sidequest: { title: a.title, category: a.category },
      }));

      console.log(`[loadActivityFeed] Loaded ${formattedActivities.length} activities for circle ${circleId}`);
      set({ activityFeed: formattedActivities });
      await saveCache(cacheKeyActivity(circleId), formattedActivities);
      })();

      inflight.set(key, p);
      await p;
      inflight.delete(key);
    } catch (err) {
      // Fallback to cache to avoid empty flicker
      const cached = await loadCache<ActivityFeedItem[]>(cacheKeyActivity(circleId));
      if (cached && cached.length > 0) set({ activityFeed: cached });
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
      // Collect IDs from circles
      const { data: circles, error: circlesError } = await supabase
        .from('friend_circles')
        .select('id, sidequest_ids')
        .in('id', circleIds);
      if (circlesError) { console.warn('[loadGlobalActivityFeed] circles error', circlesError); throw circlesError; }

      const allIds = Array.from(new Set((circles || []).flatMap((c: any) => c.sidequest_ids || [])));
      if (allIds.length === 0) { set({ activityFeed: [] }); return; }

      const { data: activities, error: activitiesError } = await supabase
        .from('sidequest_activities')
        .select('id, user_id, description, review, created_at, image_urls, location, title, category, status')
        .in('id', allIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (activitiesError) { console.warn('[loadGlobalActivityFeed] activities error', activitiesError); throw activitiesError; }

      // Load user data separately
      const userIds = [...new Set((activities || []).map(a => a.user_id))];
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

      const formattedActivities: ActivityFeedItem[] = (activities || []).map((a: any) => ({
        id: a.id,
        sidequest_id: a.id,
        user_id: a.user_id,
        activity_type: 'created' as const,
        created_at: a.created_at,
        description: a.description,
        review: a.review,
        image_urls: a.image_urls,
        location: a.location,
        user: userMap[a.user_id] || { display_name: 'Unknown User', avatar_url: null },
        sidequest: { title: a.title, category: a.category },
      }));

      console.log(`[loadGlobalActivityFeed] Loaded ${formattedActivities.length} activities across ${circleIds.length} circles`);
      set({ activityFeed: formattedActivities });
    } catch (err) {
      get().setError(err instanceof Error ? err.message : 'Failed to load activity feed');
    }
  },
}));