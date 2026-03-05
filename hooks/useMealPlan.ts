'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { weekStartISO } from '@/lib/utils';
import { useHousehold } from './useHousehold';
import { useAuthStore } from '@/stores/authStore';
import type { MealType } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealPlan {
  id: string;
  household_id: string;
  week_start_date: string;
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
}

export interface MealPlanSlot {
  id: string;
  meal_plan_id: string;
  day_of_week: number; // 0=Monday … 6=Sunday
  meal_type: MealType;
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
  /** slots organised as slotsByDay[dayIndex][meal_type] */
  slotsByDay: Record<number, Partial<Record<MealType, MealPlanSlot>>>;
  voteStatus: VoteStatus;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildSlotsByDay(
  slots: MealPlanSlot[],
): Record<number, Partial<Record<MealType, MealPlanSlot>>> {
  const byDay: Record<number, Partial<Record<MealType, MealPlanSlot>>> = {};
  for (let d = 0; d < 7; d++) byDay[d] = {};
  for (const slot of slots) byDay[slot.day_of_week][slot.meal_type] = slot;
  return byDay;
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
        .select('id, household_id, week_start_date, created_by, finalized_at, created_at')
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
            'id, meal_plan_id, day_of_week, meal_type, recipe:recipes(id, title, emoji, bg_color, advance_prep_days)',
          )
          .eq('meal_plan_id', plan.id)
          .order('day_of_week')
          .order('meal_type');

        if (slotsErr) throw slotsErr;

        slots = (
          (slotsRaw ?? []) as unknown as Array<{
            id: string;
            meal_plan_id: string;
            day_of_week: number;
            meal_type: string;
            recipe: SlotRecipe | SlotRecipe[] | null;
          }>
        ).map((s) => ({
          id: s.id,
          meal_plan_id: s.meal_plan_id,
          day_of_week: s.day_of_week,
          meal_type: s.meal_type as MealType,
          recipe: Array.isArray(s.recipe)
            ? s.recipe[0]
            : (s.recipe ?? {
                id: '',
                title: 'Unknown',
                emoji: '🍽️',
                bg_color: '#64748b',
                advance_prep_days: 0,
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

      // ── 4. Organise slots by day ─────────────────────────────────────────
      const slotsByDay = buildSlotsByDay(slots);

      return {
        weekStart,
        plan,
        slots,
        slotsByDay,
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
      dayOfWeek,
      mealType,
    }: {
      recipeId: string;
      dayOfWeek: number;
      mealType: MealType;
      recipe: SlotRecipe; // carried for optimistic update, not sent to DB
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
            created_by: user?.id ?? null,
          })
          .select('id')
          .single();
        if (planErr) throw planErr;
        planId = (newPlan as unknown as { id: string }).id;
      }

      // Upsert the slot (replaces if same day+meal already filled)
      const { error: slotErr } = await supabase.from('meal_plan_slots').upsert(
        {
          meal_plan_id: planId,
          recipe_id: recipeId,
          day_of_week: dayOfWeek,
          meal_type: mealType,
        },
        { onConflict: 'meal_plan_id,day_of_week,meal_type' },
      );
      if (slotErr) throw slotErr;
    },

    onMutate: async ({ dayOfWeek, mealType, recipe }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const optimisticSlot: MealPlanSlot = {
          id: `optimistic-${Date.now()}`,
          meal_plan_id: previous.plan?.id ?? 'pending',
          day_of_week: dayOfWeek,
          meal_type: mealType,
          recipe,
        };
        const newSlots = [
          ...previous.slots.filter(
            (s) => !(s.day_of_week === dayOfWeek && s.meal_type === mealType),
          ),
          optimisticSlot,
        ];
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: newSlots,
          slotsByDay: buildSlotsByDay(newSlots),
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
          slotsByDay: buildSlotsByDay(newSlots),
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
      newDayOfWeek,
      newMealType,
    }: {
      slotId: string;
      newDayOfWeek: number;
      newMealType: MealType;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_slots')
        .update({ day_of_week: newDayOfWeek, meal_type: newMealType } as never)
        .eq('id', slotId);
      if (error) throw error;
    },

    onMutate: async ({ slotId, newDayOfWeek, newMealType }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<WeekPlanData>(queryKey);
      if (previous) {
        const newSlots = previous.slots.map((s) =>
          s.id === slotId ? { ...s, day_of_week: newDayOfWeek, meal_type: newMealType } : s,
        );
        // If target slot was occupied, remove the old occupant (the moved slot replaces it)
        const deduped = newSlots.filter(
          (s) =>
            s.id === slotId ||
            !(s.day_of_week === newDayOfWeek && s.meal_type === newMealType && s.id !== slotId),
        );
        qc.setQueryData<WeekPlanData>(queryKey, {
          ...previous,
          slots: deduped,
          slotsByDay: buildSlotsByDay(deduped),
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
    },
  });
}
