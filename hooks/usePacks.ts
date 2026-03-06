'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PackItem {
  id: string;
  pack_id: string;
  recipe_id: string;
  sort_order: number;
  recipe: {
    id: string;
    title: string;
    emoji: string;
    bg_color: string;
  };
}

export interface Pack {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  items: PackItem[];
}

// ─── List packs for a household ───────────────────────────────────────────────

export function usePacks(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.packs.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<Pack[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('household_packs')
        .select(
          'id, household_id, name, description, created_by, created_at, items:household_pack_items(id, pack_id, recipe_id, sort_order, recipe:recipes(id, title, emoji, bg_color))',
        )
        .eq('household_id', householdId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Pack[];
    },
  });
}

// ─── Packs attached to a plan ─────────────────────────────────────────────────

export function usePlanPacks(planId: string | null) {
  return useQuery({
    queryKey: queryKeys.planPacks.list(planId ?? ''),
    enabled: !!planId,
    queryFn: async (): Promise<{ id: string; pack_id: string; pack: Pack }[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('meal_plan_packs')
        .select(
          'id, pack_id, pack:household_packs(id, household_id, name, description, created_by, created_at, items:household_pack_items(id, pack_id, recipe_id, sort_order, recipe:recipes(id, title, emoji, bg_color)))',
        )
        .eq('plan_id', planId!);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; pack_id: string; pack: Pack }[];
    },
  });
}

// ─── Create pack ──────────────────────────────────────────────────────────────

export function useCreatePack() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      householdId,
      name,
      description,
    }: {
      householdId: string;
      name: string;
      description?: string;
    }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('household_packs')
        .insert({
          household_id: householdId,
          name: name.trim(),
          description: description?.trim() || null,
          created_by: user?.id ?? null,
        } as never)
        .select('id')
        .single();
      if (error) throw error;
      return (data as unknown as { id: string }).id;
    },
    onSuccess: (_, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.packs.list(householdId) });
    },
  });
}

// ─── Update pack ──────────────────────────────────────────────────────────────

export function useUpdatePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packId,
      householdId,
      name,
      description,
    }: {
      packId: string;
      householdId: string;
      name: string;
      description?: string | null;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('household_packs')
        .update({ name: name.trim(), description: description?.trim() || null } as never)
        .eq('id', packId);
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.packs.list(householdId) });
    },
  });
}

// ─── Delete pack ──────────────────────────────────────────────────────────────

export function useDeletePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ packId, householdId }: { packId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('household_packs').delete().eq('id', packId);
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.packs.list(householdId) });
    },
  });
}

// ─── Add / remove recipe items ────────────────────────────────────────────────

export function useAddPackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packId,
      recipeId,
      householdId,
    }: {
      packId: string;
      recipeId: string;
      householdId: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('household_pack_items')
        .insert({ pack_id: packId, recipe_id: recipeId } as never);
      if (error && error.code !== '23505') throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.packs.list(householdId) });
    },
  });
}

export function useRemovePackItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, householdId }: { itemId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('household_pack_items').delete().eq('id', itemId);
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.packs.list(householdId) });
    },
  });
}

// ─── Attach / detach pack to plan ─────────────────────────────────────────────

export function useAttachPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, packId }: { planId: string; packId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_packs')
        .insert({ plan_id: planId, pack_id: packId } as never);
      if (error && error.code !== '23505') throw error;
      return planId;
    },
    onSuccess: (planId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.planPacks.list(planId) });
    },
  });
}

export function useDetachPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mealPlanPackId, planId }: { mealPlanPackId: string; planId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_packs')
        .delete()
        .eq('id', mealPlanPackId);
      if (error) throw error;
      return planId;
    },
    onSuccess: (planId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.planPacks.list(planId) });
    },
  });
}
