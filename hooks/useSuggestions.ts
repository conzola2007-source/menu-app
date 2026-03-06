'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Suggestion {
  id: string;
  household_id: string;
  user_id: string | null;
  content: string;
  type: 'note' | 'update_ingredient_price' | 'add_recipe' | 'remove_recipe';
  payload: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// ── useSuggestions — pending suggestions for a household (heads only) ─────────

export function useSuggestions(householdId: string | undefined) {
  return useQuery({
    queryKey: ['suggestions', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Suggestion[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, household_id, user_id, content, type, payload, status, created_at, profile:profiles(display_name, avatar_url)')
        .eq('household_id', householdId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        const profile = row.profile;
        return {
          id: row.id as string,
          household_id: row.household_id as string,
          user_id: row.user_id as string | null,
          content: row.content as string,
          type: (row.type as Suggestion['type']) ?? 'note',
          payload: (row.payload as Record<string, unknown> | null) ?? null,
          status: row.status as Suggestion['status'],
          created_at: row.created_at as string,
          profile: Array.isArray(profile) ? (profile[0] ?? null) : (profile as Suggestion['profile']),
        };
      });
    },
  });
}

// ── useMySuggestions — all suggestions submitted by current user ───────────────

export function useMySuggestions(householdId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['suggestions', householdId, 'mine', userId],
    enabled: !!householdId && !!userId,
    queryFn: async (): Promise<Suggestion[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, household_id, user_id, content, type, payload, status, created_at')
        .eq('household_id', householdId!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          household_id: row.household_id as string,
          user_id: row.user_id as string | null,
          content: row.content as string,
          type: (row.type as Suggestion['type']) ?? 'note',
          payload: (row.payload as Record<string, unknown> | null) ?? null,
          status: row.status as Suggestion['status'],
          created_at: row.created_at as string,
          profile: null,
        };
      });
    },
  });
}

// ── useSubmitSuggestion ───────────────────────────────────────────────────────

export function useSubmitSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, content }: { householdId: string; content: string }) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('suggestions')
        .insert({ household_id: householdId, user_id: user.id, content });

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions', vars.householdId] });
    },
  });
}

// ── useRespondToSuggestion — approve/deny, with auto-execute on approve ───────

export function useRespondToSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      suggestionId,
      householdId,
      status,
      type,
      payload,
    }: {
      suggestionId: string;
      householdId: string;
      status: 'approved' | 'denied';
      type?: Suggestion['type'];
      payload?: Record<string, unknown> | null;
    }) => {
      const supabase = getSupabaseClient();

      // Auto-execute side effects on approval
      if (status === 'approved' && type && type !== 'note') {
        if (type === 'add_recipe' && payload?.recipe_id) {
          await supabase
            .from('household_recipes')
            .insert({ household_id: householdId, recipe_id: payload.recipe_id as string } as never)
            .throwOnError();
        } else if (type === 'remove_recipe' && payload?.recipe_id) {
          await supabase
            .from('household_recipes')
            .delete()
            .eq('household_id', householdId)
            .eq('recipe_id', payload.recipe_id as string)
            .throwOnError();
        } else if (type === 'update_ingredient_price' && payload?.ingredient_id) {
          const update: Record<string, unknown> = {};
          if (payload.pack_qty != null) update.pack_qty = payload.pack_qty;
          if (payload.pack_price != null) update.pack_price = payload.pack_price;
          if (Object.keys(update).length > 0) {
            await supabase
              .from('ingredients')
              .update(update as never)
              .eq('id', payload.ingredient_id as string)
              .throwOnError();
          }
        }
      }

      const { error } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;
      return householdId;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions', vars.householdId] });
      // Invalidate related data if auto-executed
      if (vars.status === 'approved' && vars.type === 'add_recipe') {
        void queryClient.invalidateQueries({ queryKey: ['householdPool'] });
      } else if (vars.status === 'approved' && vars.type === 'remove_recipe') {
        void queryClient.invalidateQueries({ queryKey: ['householdPool'] });
      } else if (vars.status === 'approved' && vars.type === 'update_ingredient_price') {
        void queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      }
    },
  });
}
