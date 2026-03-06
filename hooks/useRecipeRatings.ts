'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeRating {
  id: string;
  recipe_id: string;
  household_id: string;
  user_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// ─── useRecipeRatings ─────────────────────────────────────────────────────────

export function useRecipeRatings(recipeId: string | null, householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.recipeRatings.list(recipeId ?? '', householdId ?? ''),
    enabled: !!recipeId && !!householdId,
    queryFn: async (): Promise<RecipeRating[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_ratings')
        .select('id, recipe_id, household_id, user_id, stars, comment, created_at, updated_at')
        .eq('recipe_id', recipeId!)
        .eq('household_id', householdId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RecipeRating[];
    },
  });
}

// ─── useUpsertRating ──────────────────────────────────────────────────────────

export function useUpsertRating() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      recipeId,
      householdId,
      stars,
      comment,
    }: {
      recipeId: string;
      householdId: string;
      stars: number;
      comment?: string | null;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('recipe_ratings').upsert(
        {
          recipe_id: recipeId,
          household_id: householdId,
          user_id: user!.id,
          stars,
          comment: comment ?? null,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'recipe_id,household_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: (_d, { recipeId, householdId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.recipeRatings.list(recipeId, householdId),
      });
    },
  });
}

// ─── useDeleteRating ──────────────────────────────────────────────────────────

export function useDeleteRating() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      recipeId,
      householdId,
    }: {
      recipeId: string;
      householdId: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_ratings')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('household_id', householdId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, { recipeId, householdId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.recipeRatings.list(recipeId, householdId),
      });
    },
  });
}
