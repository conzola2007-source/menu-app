'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealHistoryEntry {
  slot_id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_emoji: string;
  recipe_bg_color: string;
  slot_date: string;
  chef_id: string | null;
  chef_name: string | null;
  avg_stars: number | null;
  week_start_date: string;
}

export interface HouseholdAnalytics {
  top_recipes: {
    id: string;
    title: string;
    emoji: string;
    bg_color: string;
    cook_count: number;
    avg_stars: number | null;
  }[] | null;
  top_chefs: {
    user_id: string;
    display_name: string;
    meals_cooked: number;
  }[] | null;
  total_meals: number;
}

// ─── useMealHistory ───────────────────────────────────────────────────────────

export function useMealHistory(householdId: string | null, limit = 30) {
  return useQuery({
    queryKey: queryKeys.mealHistory.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<MealHistoryEntry[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_meal_history', {
        p_household_id: householdId!,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as MealHistoryEntry[];
    },
  });
}

// ─── useHouseholdAnalytics ────────────────────────────────────────────────────

export function useHouseholdAnalytics(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.get(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<HouseholdAnalytics> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('get_household_analytics', {
        p_household_id: householdId!,
      });
      if (error) throw error;
      return (data ?? { top_recipes: null, top_chefs: null, total_meals: 0 }) as HouseholdAnalytics;
    },
  });
}
