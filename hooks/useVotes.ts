'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useHousehold } from '@/hooks/useHousehold';
import { queryKeys } from '@/lib/queryKeys';
import { weekStartISO } from '@/lib/utils';
import type { VoteType, StorageLocation, IngredientUnit } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoteIngredient {
  id: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  storage_location: StorageLocation;
  sort_order: number;
}

export interface VoteStep {
  id: string;
  step_order: number;
  instruction: string;
}

export interface VoteRecipe {
  id: string;
  title: string;
  description: string;
  emoji: string;
  bg_color: string;
  cuisine: string;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  advance_prep_days: number;
  advance_prep_note: string | null;
  is_global: boolean;
  household_id: string | null;
  ingredients: VoteIngredient[];
  steps: VoteStep[];
}

export interface MemberVoteStatus {
  user_id: string;
  display_name: string;
  hasFinished: boolean;
  votedCount: number;
}

export interface WeekVoteData {
  recipes: VoteRecipe[];
  myVotes: Record<string, VoteType>;
  unvotedRecipes: VoteRecipe[];
  memberStatuses: MemberVoteStatus[];
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[];
  totalMembers: number;
  allMembersFinished: boolean;
}

// ─── Deterministic shuffle (week_start_date as seed) ─────────────────────────

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  // Convert seed string → 32-bit integer via simple hash
  let s = Array.from(seed).reduce(
    (acc, c) => (Math.imul(acc, 31) + c.charCodeAt(0)) | 0,
    0,
  );
  for (let i = copy.length - 1; i > 0; i--) {
    // LCG step
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── useVoteData ──────────────────────────────────────────────────────────────

export function useVoteData() {
  const user = useAuthStore((s) => s.user);
  const { data: membership } = useHousehold();
  const queryClient = useQueryClient();
  const householdId = membership?.household.id ?? '';
  const weekStart = weekStartISO();

  // Real-time: invalidate when any vote in this household/week changes
  useEffect(() => {
    if (!householdId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`votes:${householdId}:${weekStart}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.votes.week(householdId, weekStart),
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, weekStart, queryClient]);

  return useQuery({
    queryKey: queryKeys.votes.week(householdId, weekStart),
    enabled: !!householdId && !!user,
    queryFn: async (): Promise<WeekVoteData> => {
      const supabase = getSupabaseClient();
      const userId = user!.id;

      // 1. All recipes accessible to this household
      const { data: recipesRaw, error: recipeError } = await supabase
        .from('recipes')
        .select(
          `id, title, description, emoji, bg_color, cuisine,
           prep_time_min, cook_time_min, servings,
           advance_prep_days, advance_prep_note, is_global, household_id,
           ingredients:recipe_ingredients(id, name, amount, unit, storage_location, sort_order),
           steps:recipe_steps(id, step_order, instruction)`,
        )
        .or(`is_global.eq.true,household_id.eq.${householdId}`)
        .order('created_at');

      if (recipeError) throw recipeError;
      const recipes = (recipesRaw as unknown as VoteRecipe[]) ?? [];

      // 2. All votes for this household + week
      const { data: votesRaw, error: voteError } = await supabase
        .from('votes')
        .select('user_id, recipe_id, vote')
        .eq('household_id', householdId)
        .eq('week_start_date', weekStart);

      if (voteError) throw voteError;
      const allVotes = (votesRaw ?? []) as {
        user_id: string;
        recipe_id: string;
        vote: VoteType;
      }[];

      // 3. Deterministic shuffle using week start as seed
      const shuffled = seededShuffle(recipes, weekStart);

      // 4. My votes map: recipe_id → vote
      const myVotes: Record<string, VoteType> = {};
      for (const v of allVotes) {
        if (v.user_id === userId) myVotes[v.recipe_id] = v.vote;
      }

      // 5. Recipes I haven't voted on yet
      const unvotedRecipes = shuffled.filter((r) => !(r.id in myVotes));

      // 6. Member statuses
      const members = membership?.members ?? [];
      const recipeIdSet = new Set(recipes.map((r) => r.id));

      const memberStatuses: MemberVoteStatus[] = members.map((m) => {
        const votedIds = new Set(
          allVotes.filter((v) => v.user_id === m.user_id).map((v) => v.recipe_id),
        );
        const hasFinished =
          recipeIdSet.size > 0 && [...recipeIdSet].every((id) => votedIds.has(id));
        return {
          user_id: m.user_id,
          display_name: m.profile.display_name,
          hasFinished,
          votedCount: votedIds.size,
        };
      });

      const allMembersFinished =
        members.length > 0 && memberStatuses.every((m) => m.hasFinished);

      return {
        recipes: shuffled,
        myVotes,
        unvotedRecipes,
        memberStatuses,
        allVotes,
        totalMembers: members.length,
        allMembersFinished,
      };
    },
  });
}

// ─── useSubmitVote ────────────────────────────────────────────────────────────

export function useSubmitVote() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: membership } = useHousehold();

  return useMutation({
    mutationFn: async ({
      recipeId,
      vote,
    }: {
      recipeId: string;
      vote: VoteType;
    }) => {
      const supabase = getSupabaseClient();
      const weekStart = weekStartISO();
      const householdId = membership!.household.id;

      const { error } = await supabase.from('votes').upsert(
        {
          household_id: householdId,
          user_id: user!.id,
          recipe_id: recipeId,
          week_start_date: weekStart,
          vote,
        },
        { onConflict: 'household_id,user_id,recipe_id,week_start_date' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      const householdId = membership?.household.id;
      if (householdId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.votes.week(householdId, weekStartISO()),
        });
      }
    },
  });
}
