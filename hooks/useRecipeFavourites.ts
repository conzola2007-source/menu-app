'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeFavourite {
  id: string;
  recipe_id: string;
  household_id: string;
  user_id: string;
  created_at: string;
}

// ─── useRecipeFavourites ──────────────────────────────────────────────────────

export function useRecipeFavourites(householdId: string | null) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.recipeFavourites.list(householdId ?? ''),
    enabled: !!householdId && !!user,
    queryFn: async (): Promise<RecipeFavourite[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_favourites')
        .select('id, recipe_id, household_id, user_id, created_at')
        .eq('household_id', householdId!)
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as RecipeFavourite[];
    },
  });
}

// ─── useToggleFavourite ───────────────────────────────────────────────────────

export function useToggleFavourite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      recipeId,
      householdId,
      isFav,
    }: {
      recipeId: string;
      householdId: string;
      isFav: boolean;
    }) => {
      const supabase = getSupabaseClient();
      if (isFav) {
        const { error } = await supabase
          .from('recipe_favourites')
          .delete()
          .eq('recipe_id', recipeId)
          .eq('household_id', householdId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipe_favourites').insert({
          recipe_id: recipeId,
          household_id: householdId,
          user_id: user!.id,
        } as never);
        if (error && error.code !== '23505') throw error;
      }
    },
    onSuccess: (_d, { householdId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.recipeFavourites.list(householdId),
      });
    },
  });
}
