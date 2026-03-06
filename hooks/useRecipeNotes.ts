'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

export interface RecipeNote {
  id: string;
  recipe_id: string;
  household_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  display_name: string;
}

// ─── useRecipeNotes ───────────────────────────────────────────────────────────

export function useRecipeNotes(recipeId: string | null, householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.recipeNotes.list(recipeId ?? '', householdId ?? ''),
    enabled: !!recipeId && !!householdId,
    queryFn: async (): Promise<RecipeNote[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_notes')
        .select('*, profile:profiles(display_name)')
        .eq('recipe_id', recipeId!)
        .eq('household_id', householdId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as (RecipeNote & { profile: { display_name: string } })[]).map((n) => ({
        ...n,
        display_name: n.profile?.display_name ?? 'Member',
      }));
    },
  });
}

// ─── useUpsertRecipeNote ──────────────────────────────────────────────────────

export function useUpsertRecipeNote() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      recipeId,
      householdId,
      content,
    }: {
      recipeId: string;
      householdId: string;
      content: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('recipe_notes').upsert(
        {
          recipe_id: recipeId,
          household_id: householdId,
          user_id: user!.id,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'recipe_id,household_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: (_data, { recipeId, householdId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.recipeNotes.list(recipeId, householdId),
      });
    },
  });
}

// ─── useDeleteRecipeNote ──────────────────────────────────────────────────────

export function useDeleteRecipeNote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      recipeId,
      householdId,
    }: {
      noteId: string;
      recipeId: string;
      householdId: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('recipe_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: (_data, { recipeId, householdId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.recipeNotes.list(recipeId, householdId),
      });
    },
  });
}
