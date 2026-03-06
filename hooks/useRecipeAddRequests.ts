'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeAddRequest {
  id: string;
  household_id: string;
  recipe_id: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  recipe: {
    id: string;
    title: string;
    emoji: string;
    bg_color: string;
  };
  profile: {
    display_name: string;
  };
}

// ─── Pending requests for heads ───────────────────────────────────────────────

export function useRecipeAddRequests(householdId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recipeAddRequests.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<RecipeAddRequest[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_add_requests')
        .select(
          'id, household_id, recipe_id, requested_by, status, created_at, recipe:recipes(id, title, emoji, bg_color), profile:profiles!recipe_add_requests_requested_by_fkey(display_name)',
        )
        .eq('household_id', householdId!)
        .eq('status', 'pending')
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as unknown as RecipeAddRequest[];
    },
  });
}

// ─── My pending submissions ───────────────────────────────────────────────────

export function useMyRecipeAddRequests(householdId: string | null) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.recipeAddRequests.mine(householdId ?? ''),
    enabled: !!householdId && !!user,
    queryFn: async (): Promise<{ recipe_id: string; status: string }[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_add_requests')
        .select('recipe_id, status')
        .eq('household_id', householdId!)
        .eq('requested_by', user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as { recipe_id: string; status: string }[];
    },
  });
}

// ─── Submit request (member) ──────────────────────────────────────────────────

export function useSubmitRecipeAddRequest() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ householdId, recipeId }: { householdId: string; recipeId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_add_requests')
        .insert({ household_id: householdId, recipe_id: recipeId, requested_by: user!.id } as never);
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: (_, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeAddRequests.mine(householdId) });
      void qc.invalidateQueries({ queryKey: queryKeys.recipeAddRequests.list(householdId) });
    },
  });
}

// ─── Directly add to pool (head only) ────────────────────────────────────────

export function useAddRecipeToPool() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ householdId, recipeId }: { householdId: string; recipeId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('household_recipes')
        .insert({ household_id: householdId, recipe_id: recipeId, added_by: user!.id } as never);
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: (_, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.householdPool.list(householdId) });
    },
  });
}

// ─── Approve (head) ───────────────────────────────────────────────────────────

export function useApproveRecipeAddRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, householdId }: { requestId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('approve_recipe_add_request', { request_id: requestId });
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeAddRequests.list(householdId) });
      void qc.invalidateQueries({ queryKey: queryKeys.householdPool.list(householdId) });
    },
  });
}

// ─── Deny (head) ──────────────────────────────────────────────────────────────

export function useDenyRecipeAddRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, householdId }: { requestId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('deny_recipe_add_request', { request_id: requestId });
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeAddRequests.list(householdId) });
    },
  });
}
