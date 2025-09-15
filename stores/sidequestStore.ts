import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Sidequest, SidequestCategory, SidequestStatus } from '../types/sidequest';

interface SidequestStore {
  // State
  sidequests: Sidequest[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUserSidequests: (userId: string) => Promise<void>;
  addSidequest: (sidequest: Omit<Sidequest, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => Promise<void>;
  updateSidequest: (id: string, updates: Partial<Sidequest>) => Promise<void>;
  deleteSidequest: (id: string) => Promise<void>;
  getSidequestById: (id: string) => Sidequest | undefined;
  getSidequestsByStatus: (status: SidequestStatus) => Sidequest[];
  getSidequestsByCategory: (category: SidequestCategory) => Sidequest[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSidequestStore = create<SidequestStore>((set, get) => ({
  // Initial state
  sidequests: [],
  isLoading: false,
  error: null,

  // Basic setters
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  // Load user's sidequests from Supabase
  loadUserSidequests: async (userId: string) => {
    try {
      get().setLoading(true);
      get().setError(null);
      
      const { data, error } = await supabase
        .from('social_sidequests')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map social sidequests to personal sidequest format
      const sidequests: Sidequest[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: mapCategory(item.category),
        difficulty: mapDifficulty(item.difficulty),
        estimatedTime: 'Unknown',
        status: mapStatus(item.status),
        tags: item.circle_id ? ['space-shared'] : [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
        progress: item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0,
        notes: item.review || undefined,
      }));

      set({ sidequests });
      console.log(`[SidequestStore] Loaded ${sidequests.length} sidequests for user ${userId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load sidequests';
      get().setError(errorMsg);
      console.error('[SidequestStore] Error loading sidequests:', err);
    } finally {
      get().setLoading(false);
    }
  },

  // Add new sidequest to Supabase
  addSidequest: async (sidequestData: Omit<Sidequest, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('social_sidequests')
        .insert({
          title: sidequestData.title,
          description: sidequestData.description,
          category: sidequestData.category.toLowerCase(),
          difficulty: sidequestData.difficulty.toLowerCase(),
          status: mapStatusToDb(sidequestData.status),
          created_by: userId,
          visibility: 'private',
          review: sidequestData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload user sidequests to get the updated list
      await get().loadUserSidequests(userId);
      console.log('[SidequestStore] Added new sidequest:', data.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add sidequest';
      get().setError(errorMsg);
      throw err;
    }
  },

  // Update sidequest in Supabase
  updateSidequest: async (id: string, updates: Partial<Sidequest>) => {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = mapStatusToDb(updates.status);
      if (updates.notes !== undefined) updateData.review = updates.notes;
      if (updates.status === SidequestStatus.COMPLETED) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('social_sidequests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        sidequests: state.sidequests.map(sidequest => 
          sidequest.id === id 
            ? { ...sidequest, ...updates, updatedAt: new Date() }
            : sidequest
        )
      }));
      console.log('[SidequestStore] Updated sidequest:', id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update sidequest';
      get().setError(errorMsg);
      throw err;
    }
  },

  // Delete sidequest from Supabase
  deleteSidequest: async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_sidequests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        sidequests: state.sidequests.filter(sidequest => sidequest.id !== id)
      }));
      console.log('[SidequestStore] Deleted sidequest:', id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete sidequest';
      get().setError(errorMsg);
      throw err;
    }
  },

  // Local getters (no changes needed)
  getSidequestById: (id: string) => {
    return get().sidequests.find(sidequest => sidequest.id === id);
  },

  getSidequestsByStatus: (status: SidequestStatus) => {
    return get().sidequests.filter(sidequest => sidequest.status === status);
  },

  getSidequestsByCategory: (category: SidequestCategory) => {
    return get().sidequests.filter(sidequest => sidequest.category === category);
  },
}));

// Helper functions to map between database and app formats
function mapCategory(dbCategory: string): SidequestCategory {
  const categoryMap: Record<string, SidequestCategory> = {
    'creative': SidequestCategory.CREATIVE,
    'learning': SidequestCategory.LEARNING,
    'fitness': SidequestCategory.FITNESS,
    'social': SidequestCategory.SOCIAL,
    'career': SidequestCategory.CAREER,
    'hobby': SidequestCategory.HOBBY,
    'adventure': SidequestCategory.ADVENTURE,
    'productivity': SidequestCategory.PRODUCTIVITY,
    'health': SidequestCategory.HEALTH,
    'other': SidequestCategory.OTHER
  };
  return categoryMap[dbCategory] || SidequestCategory.OTHER;
}

function mapDifficulty(dbDifficulty: string): any {
  const difficultyMap: Record<string, any> = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard'
  };
  return difficultyMap[dbDifficulty] || 'Easy';
}

function mapStatus(dbStatus: string): SidequestStatus {
  const statusMap: Record<string, SidequestStatus> = {
    'not_started': SidequestStatus.NOT_STARTED,
    'in_progress': SidequestStatus.IN_PROGRESS,
    'completed': SidequestStatus.COMPLETED
  };
  return statusMap[dbStatus] || SidequestStatus.NOT_STARTED;
}

function mapStatusToDb(status: SidequestStatus): string {
  const statusMap: Record<SidequestStatus, string> = {
    [SidequestStatus.NOT_STARTED]: 'not_started',
    [SidequestStatus.IN_PROGRESS]: 'in_progress',
    [SidequestStatus.COMPLETED]: 'completed',
    [SidequestStatus.PAUSED]: 'in_progress',
    [SidequestStatus.ABANDONED]: 'not_started'
  };
  return statusMap[status] || 'not_started';
}
