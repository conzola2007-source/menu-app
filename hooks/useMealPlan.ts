'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { weekStartISO } from '@/lib/utils';
import { useHousehold } from './useHousehold';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealPlan {
  id: string;
  household_id: string;
  week_start_date: string;
  start_date: string | null;      // T7-B: explicit start date (defaults to week_start_date)
  duration_days: number;          // T7-B: how many days to plan (default 7)
  created_by: string | null;
  finalized_at: string | null;
  created_at: string;
}

export interface SlotRecipe {
  id: string;
  title: string;
  emoji: string;
  bg_color: string;
  advance_prep_days: number;
  servings: number;
}

export interface MealPlanSlot {
  id: string;
  meal_plan_id: string;
  slot_date: string;    // T7-B: actual date string YYYY-MM-DD (replaced day_of_week + meal_type)
  chef_id: string | null;
  servings_override: number | null;
  recipe: SlotRecipe;
}

export interface VoteStatus {
  /** user_ids who have cast at least one vote this week */
  votedUserIds: string[];
  /** display_names corresponding to votedUserIds */
  votedNames: string[];
  /** total household member count */
  totalMembers: number;
  /** display_names of members who have NOT voted yet */
  waitingOnNames: string[];
}

export interface WeekPlanData {
  weekStart: string;
  plan: MealPlan | null;
  slots: MealPlanSlot[];
  /** slots keyed by slot_date (YYYY-MM-DD) */
  slotsByDate: Record<string, MealPlanSlot>;
  voteStatus: VoteStatus;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildSlotsByDate(slots: MealPlanSlot[]): Record<string, MealPlanSlot> {
  const byDate: Record<string, MealPlanSlot> = {};
  for (const slot of slots) byDate[slot.slot_date] = slot;
  return byDate;
}

// ─── useMealPlan ──────────────────────────────────────────────────────────────

export function useMealPlan(overrideWeekStart?: string) {
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? null;
  const weekStart = overrideWeekStart ?? weekStartISO();
  const qc = useQueryClient();

  // Real-time: invalidate whenever meal_plan or meal_plan_slots change for this household
  useEffect(() => {
    if (!householdId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`mealplan:${householdId}:${weekStart}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_plans', filter: `household_id=eq.${householdId}` },
        () => { void qc.invalidateQueries({ queryKey: queryKeys.mealPlan.week(householdId, weekStart) }); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_plan_slots' },
        () => { void qc.invalidateQueries({ queryKey: queryKeys.mealPlan.week(householdId, weekStart) }); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [householdId, weekStart, qc]);

  return useQuery({
    queryKey: queryKeys.mealPlan.week(householdId ?? '', weekStart),
    enabled: !!householdId,
    queryFn: async (): Promise<WeekPlanData> => {
      const supabase = getSupabaseClient();

      // ── 1. Load meal plan for this week ──────────────────────────────────
      const { data: planRaw, error: planErr } = await supabase
        .from('meal_plans')
        .select('id, household_id, week_start_date, start_date, duration_days, created_by, finalized_at, created_at')
        .eq('household_id', householdId!)
        .eq('week_start_date', weekStart)
        .maybeSingle();

      if (planErr) throw planErr;
      const plan = planRaw as unknown as MealPlan | null;

      // ── 2. Load slots + recipes (only if plan exists) ────────────────────
      let slots: MealPlanSlot[] = [];

      if (plan) {
        const { data: slotsRaw, error: slotsErr } = await supabase
          .from('meal_plan_slots')
          .select(
            'id, meal_plan_id, slot_date, chef_id, servings_override, recipe:recipes(id, title, emoji, bg_color, advance_prep_days, servings)',
          )
          .eq('meal_plan_id', plan.id)
          .order('slot_date');

        if (slotsErr) throw slotsErr;

        slots = (
          (slotsRaw ?? []) as unknown as Array<{
            id: string;
            meal_plan_id: string;
            slot_date: string;
            chef_id: string | null;
            servings_override: number | null;
            recipe: SlotRecipe | SlotRecipe[] | null;
          }>
        ).map((s) => ({
          id: s.id,
          meal_plan_id: s.meal_plan_id,
          slot_date: s.slot_date,
          chef_id: s.chef_id ?? null,
          servings_override: s.servings_override ?? null,
          recipe: Array.isArray(s.recipe)
            ? s.recipe[0]
            : (s.recipe ?? {
                id: '',
                title: 'Unknown',
                emoji: '🍽️',
                bg_color: '#64748b',
                advance_prep_days: 0,
                servings: 4,
              }),
        }));
      }

      // ── 3. Vote status ───────────────────────────────────────────────────
      const { data: votesRaw } = await supabase
        .from('votes')
        .select('user_id')
        .eq('household_id', householdId!)
        .eq('week_start_date', weekStart);

      const votedUserIds = [
        ...new Set(
          (votesRaw ?? []).map(
            (v) => (v as unknown as { user_id: string }).user_id,
          ),
        ),
      ];

      const allMembers = membership?.members ?? [];
      const totalMembers = allMembers.length;

      const votedNames = allMembers
        .filter((m) => votedUserIds.includes(m.user_id))
        .map((m) => m.profile.display_name);

      const waitingOnNames = allMembers
        .filter((m) => !votedUserIds.includes(m.user_id))
        .map((m) => m.profile.display_name);

      return {
        weekStart,
        plan,
        slots,
        slotsByDate: buildSlotsByDate(slots),
        voteStatus: { votedUserIds, votedNames, waitingOnNames, totalMembers },
      };
    },
  });
}

// ─── useAddSlot ───────────────────────────────────────────────────────────────

export function useAddSlot() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({
      recipeId,
      slotDate,
    }: {
      recipeId: string;
      slotDate: string;          // YYYY-MM-DD
      recipe: SlotRecipe;        // carried for optimistic update, not sent to DB
      durationDays?: number;     // for creating new plan row
    }) => {
      const supabase = getSupabaseClient();

      // Ensure meal plan row exists
      let planId: string;
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('household_id', householdId)
        .eq('week_start_date', weekStart)
        .maybeSingle();

      if (existing) {
        planId = (existing as unknown as { id: string }).id;
      } else {
        const { data: newPlan, error: planErr } = await supabase
          .from('meal_plans')
          .insert({
            household_id: householdId,
            week_start_date: weekStart,
            start_date: weekStart,
            created_by: user?.id ?? null,
          })
          .select('id')
          .single();
        if (planErr) throw planErr;
        planId = (newPlan as unknown as { id: string }).id;
      }

      // Upsert the slot (replaces if same date already filled)
      const { error: slotErr } = await supabase.from('meal_plan_slots').upsert(
        {
          meal_plan_id: planId,
          recipe_id: recipeId,
          slot_date: slotDate,
        },
        { onConflict: 'meal_plan_id,slot_date' },
      );
      if (slotErr) throw slotErr;
    },

    onMutate: async ({ slotDate, recipe }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const optimisticSlot: MealPlanSlot = {
          id: `optimistic-${Date.now()}`,
          meal_plan_id: previous.plan?.id ?? 'pending',
          slot_date: slotDate,
          chef_id: null,
          servings_override: null,
          recipe,
        };
        const newSlots = [
          ...previous.slots.filter((s) => s.slot_date !== slotDate),
          optimisticSlot,
        ];
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDate: buildSlotsByDate(newSlots),
        });
      }
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useRemoveSlot ────────────────────────────────────────────────────────────

export function useRemoveSlot() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async (slotId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('meal_plan_slots').delete().eq('id', slotId);
      if (error) throw error;
    },

    onMutate: async (slotId) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const newSlots = previous.slots.filter((s) => s.id !== slotId);
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDate: buildSlotsByDate(newSlots),
        });
      }
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useMoveSlot ─────────────────────────────────────────────────────────────

export function useMoveSlot() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({
      slotId,
      newSlotDate,
    }: {
      slotId: string;
      newSlotDate: string;   // YYYY-MM-DD
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_slots')
        .update({ slot_date: newSlotDate } as never)
        .eq('id', slotId);
      if (error) throw error;
    },

    onMutate: async ({ slotId, newSlotDate }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const newSlots = previous.slots
          .filter((s) => !(s.slot_date === newSlotDate && s.id !== slotId))
          .map((s) => (s.id === slotId ? { ...s, slot_date: newSlotDate } : s));
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDate: buildSlotsByDate(newSlots),
        });
      }
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useUpdatePlanDuration ────────────────────────────────────────────────────

export function useUpdatePlanDuration() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({ durationDays }: { durationDays: number }) => {
      const supabase = getSupabaseClient();

      // Upsert plan with new duration
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('household_id', householdId)
        .eq('week_start_date', weekStart)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('meal_plans')
          .update({ duration_days: durationDays } as never)
          .eq('id', (existing as unknown as { id: string }).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('meal_plans')
          .insert({
            household_id: householdId,
            week_start_date: weekStart,
            start_date: weekStart,
            duration_days: durationDays,
            created_by: user?.id ?? null,
          });
        if (error) throw error;
      }
    },

    onMutate: async ({ durationDays }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous?.plan) {
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          plan: { ...previous.plan, duration_days: durationDays },
        });
      }
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useUpdateSlotChef ────────────────────────────────────────────────────────

export function useUpdateSlotChef() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({ slotId, chefId }: { slotId: string; chefId: string | null }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_slots')
        .update({ chef_id: chefId } as never)
        .eq('id', slotId);
      if (error) throw error;
    },
    onMutate: async ({ slotId, chefId }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const newSlots = previous.slots.map((s) =>
          s.id === slotId ? { ...s, chef_id: chefId } : s,
        );
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDate: buildSlotsByDate(newSlots),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useUpdateSlotServings ────────────────────────────────────────────────────

export function useUpdateSlotServings() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.mealPlan.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({ slotId, servingsOverride }: { slotId: string; servingsOverride: number | null }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_slots')
        .update({ servings_override: servingsOverride } as never)
        .eq('id', slotId);
      if (error) throw error;
    },
    onMutate: async ({ slotId, servingsOverride }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const newSlots = previous.slots.map((s) =>
          s.id === slotId ? { ...s, servings_override: servingsOverride } : s,
        );
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDate: buildSlotsByDate(newSlots),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useFinalizeWeek ──────────────────────────────────────────────────────────

export function useFinalizeWeek() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();

  return useMutation({
    mutationFn: async (planId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('finalize_meal_plan', { plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.mealPlan.week(householdId, weekStart) });
      void qc.invalidateQueries({ queryKey: queryKeys.grocery.week(householdId, weekStart) });

      // Push notification to all household members (auth-gated server-side)
      void fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          type: 'plan_finalized',
          title: '📋 Meal plan finalised',
          body: 'Your household meal plan for this week is ready!',
          url: '/plan',
        }),
      });
    },
  });
}
