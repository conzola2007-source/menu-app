'use client';

// Manages per-user notification preferences stored in notification_preferences table.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/lib/supabase/types';

export type NotificationPrefs =
  Database['public']['Tables']['notification_preferences']['Row'];

const DEFAULT_PREFS: Omit<NotificationPrefs, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  plan_finalized: true,
  cooking_reminder: true,
  advance_prep_reminder: true,
  join_request: true,
  recipe_add_request: true,
};

// ─── Query ────────────────────────────────────────────────────────────────────

export function useNotificationPreferences() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.notificationPreferences.get(userId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      // Return defaults if no row yet
      return data ?? ({ user_id: userId, ...DEFAULT_PREFS } as Partial<NotificationPrefs>);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: async (
      updates: Partial<Omit<NotificationPrefs, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    ) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: userId, ...DEFAULT_PREFS, ...updates, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notificationPreferences.get(userId) });
    },
  });
}
