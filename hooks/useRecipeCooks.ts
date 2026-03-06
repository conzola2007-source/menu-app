'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeCook {
  id: string;
  recipe_id: string;
  household_id: string;
  user_id: string;
  added_at: string;
}

// ─── List cooks for a recipe ──────────────────────────────────────────────────

export function useRecipeCooks(recipeId: string | null, householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.recipeCooks.list(recipeId ?? '', householdId ?? ''),
    enabled: !!recipeId && !!householdId,
    queryFn: async (): Promise<RecipeCook[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_cooks')
        .select('id, recipe_id, household_id, user_id, added_at')
        .eq('recipe_id', recipeId!)
        .eq('household_id', householdId!)
        .order('added_at');
      if (error) throw error;
      return (data ?? []) as unknown as RecipeCook[];
    },
  });
}

// ─── Add self as cook (auto-approve) ──────────────────────────────────────────

export function useAddSelfAsCook() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ recipeId, householdId }: { recipeId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_cooks')
        .insert({ recipe_id: recipeId, household_id: householdId, user_id: user!.id } as never);
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: (_, { recipeId, householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeCooks.list(recipeId, householdId) });
    },
  });
}

// ─── Remove self as cook ──────────────────────────────────────────────────────

export function useRemoveSelfAsCook() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ recipeId, householdId }: { recipeId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_cooks')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('household_id', householdId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_, { recipeId, householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeCooks.list(recipeId, householdId) });
    },
  });
}
