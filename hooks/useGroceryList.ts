'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { weekStartISO } from '@/lib/utils';
import { useHousehold } from './useHousehold';
import { useAuthStore } from '@/stores/authStore';
import type { GroceryCategory, IngredientUnit } from '@/lib/supabase/types';
import type { PantryCheckItem } from '@/stores/groceryStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroceryList {
  id: string;
  household_id: string;
  week_start_date: string;
  created_at: string;
  pantry_checked_at: string | null;
}

export interface GroceryListItem {
  id: string;
  grocery_list_id: string;
  name: string;
  amount: number | null;
  unit: IngredientUnit | null;
  category: GroceryCategory;
  is_standalone: boolean;
  recipe_id: string | null;
  recipe_title: string | null;
  checked: boolean;
  pantry_confirmed: boolean;
  added_by: string | null;
  assigned_to: string | null;
  estimated_cost: number | null;
}

export interface GroceryListData {
  list: GroceryList | null;
  items: GroceryListItem[];
  totalEstimatedCost: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RawItem = {
  id: string;
  grocery_list_id: string;
  name: string;
  amount: number | null;
  unit: IngredientUnit | null;
  category: GroceryCategory;
  is_standalone: boolean;
  recipe_id: string | null;
  checked: boolean;
  pantry_confirmed: boolean;
  added_by: string | null;
  assigned_to: string | null;
  recipe: { title: string } | { title: string }[] | null;
};

function mapItem(raw: RawItem): GroceryListItem {
  const recipeTitle = !raw.recipe
    ? null
    : Array.isArray(raw.recipe)
      ? raw.recipe[0]?.title ?? null
      : raw.recipe.title;
  return {
    id: raw.id,
    grocery_list_id: raw.grocery_list_id,
    name: raw.name,
    amount: raw.amount,
    unit: raw.unit,
    category: raw.category,
    is_standalone: raw.is_standalone,
    recipe_id: raw.recipe_id,
    recipe_title: recipeTitle,
    checked: raw.checked,
    pantry_confirmed: raw.pantry_confirmed,
    added_by: raw.added_by,
    assigned_to: raw.assigned_to,
    estimated_cost: null,
  };
}

// ─── useGroceryList ───────────────────────────────────────────────────────────

export function useGroceryList(overrideWeekStart?: string) {
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? null;
  const weekStart = overrideWeekStart ?? weekStartISO();
  const qc = useQueryClient();

  useEffect(() => {
    if (!householdId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`grocery:${householdId}:${weekStart}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items' },
        () => {
          void qc.invalidateQueries({
            queryKey: queryKeys.grocery.week(householdId, weekStart),
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_lists',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: queryKeys.grocery.week(householdId, weekStart),
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, weekStart, qc]);

  return useQuery({
    queryKey: queryKeys.grocery.week(householdId ?? '', weekStart),
    enabled: !!householdId,
    queryFn: async (): Promise<GroceryListData> => {
      const supabase = getSupabaseClient();

      const { data: listRaw } = await supabase
        .from('grocery_lists')
        .select('id, household_id, week_start_date, created_at, pantry_checked_at')
        .eq('household_id', householdId!)
        .eq('week_start_date', weekStart)
        .maybeSingle();

      const list = listRaw as unknown as GroceryList | null;
      if (!list) return { list: null, items: [], totalEstimatedCost: null };

      const { data: itemsRaw, error } = await supabase
        .from('grocery_items')
        .select('*, recipe:recipes(title)')
        .eq('grocery_list_id', list.id)
        .order('created_at');

      if (error) throw error;

      let items = ((itemsRaw ?? []) as unknown as RawItem[]).map(mapItem);

      // ── Estimated cost calculation ──────────────────────────────────────────
      const recipeIds = [...new Set(items.filter((i) => i.recipe_id).map((i) => i.recipe_id!))];
      let totalEstimatedCost: number | null = null;

      if (recipeIds.length > 0) {
        const { data: ingredients } = await supabase
          .from('recipe_ingredients')
          .select('recipe_id, name, unit_cost')
          .in('recipe_id', recipeIds);

        if (ingredients && ingredients.length > 0) {
          // Build cost map: recipe_id -> name_lower -> unit_cost
          const costMap = new Map<string, Map<string, number>>();
          for (const ing of ingredients as { recipe_id: string; name: string; unit_cost: number | null }[]) {
            if (ing.unit_cost != null) {
              if (!costMap.has(ing.recipe_id)) costMap.set(ing.recipe_id, new Map());
              costMap.get(ing.recipe_id)!.set(ing.name.toLowerCase(), ing.unit_cost);
            }
          }

          let total = 0;
          let hasAnyCost = false;
          items = items.map((item) => {
            if (item.recipe_id && item.amount != null) {
              const unitCost = costMap.get(item.recipe_id)?.get(item.name.toLowerCase());
              if (unitCost != null) {
                const cost = item.amount * unitCost;
                hasAnyCost = true;
                total += cost;
                return { ...item, estimated_cost: cost };
              }
            }
            return item;
          });
          if (hasAnyCost) totalEstimatedCost = total;
        }
      }

      return { list, items, totalEstimatedCost };
    },
  });
}

// ─── useToggleGroceryItem ─────────────────────────────────────────────────────

export function useToggleGroceryItem() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.grocery.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('grocery_items')
        .update({ checked })
        .eq('id', itemId);
      if (error) throw error;
    },

    onMutate: async ({ itemId, checked }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<GroceryListData>(queryKey);
      if (previous) {
        qc.setQueryData<GroceryListData>(queryKey, {
          ...previous,
          items: previous.items.map((i) => (i.id === itemId ? { ...i, checked } : i)),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useAddStandaloneItem ─────────────────────────────────────────────────────

export function useAddStandaloneItem() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.grocery.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({
      listId,
      name,
      amount,
      unit,
      category,
    }: {
      listId: string;
      name: string;
      amount: number | null;
      unit: IngredientUnit | null;
      category: GroceryCategory;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('grocery_items').insert({
        grocery_list_id: listId,
        name,
        amount,
        unit,
        category,
        is_standalone: true,
        added_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useDeleteGroceryItem ─────────────────────────────────────────────────────

export function useDeleteGroceryItem() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.grocery.week(householdId, weekStart);

  return useMutation({
    mutationFn: async (itemId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('grocery_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<GroceryListData>(queryKey);
      if (previous) {
        qc.setQueryData<GroceryListData>(queryKey, {
          ...previous,
          items: previous.items.filter((i) => i.id !== itemId),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useAssignGroceryItem ─────────────────────────────────────────────────────

export function useAssignGroceryItem() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.grocery.week(householdId, weekStart);

  return useMutation({
    mutationFn: async ({ itemId, userId }: { itemId: string; userId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('grocery_items')
        .update({ assigned_to: userId } as never)
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async ({ itemId, userId }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<GroceryListData>(queryKey);
      if (previous) {
        qc.setQueryData<GroceryListData>(queryKey, {
          ...previous,
          items: previous.items.map((i) => (i.id === itemId ? { ...i, assigned_to: userId } : i)),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useUnassignGroceryItem ───────────────────────────────────────────────────

export function useUnassignGroceryItem() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();
  const queryKey = queryKeys.grocery.week(householdId, weekStart);

  return useMutation({
    mutationFn: async (itemId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('grocery_items')
        .update({ assigned_to: null } as never)
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<GroceryListData>(queryKey);
      if (previous) {
        qc.setQueryData<GroceryListData>(queryKey, {
          ...previous,
          items: previous.items.map((i) => (i.id === itemId ? { ...i, assigned_to: null } : i)),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });
}

// ─── useBatchConfirmPantry ────────────────────────────────────────────────────

export function useBatchConfirmPantry() {
  const qc = useQueryClient();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? '';
  const weekStart = weekStartISO();

  return useMutation({
    mutationFn: async ({
      listId,
      checkItems,
    }: {
      listId: string;
      checkItems: PantryCheckItem[];
    }) => {
      const supabase = getSupabaseClient();

      await Promise.all(
        checkItems.map(async (item) => {
          if (item.status === 'have') {
            await supabase
              .from('grocery_items')
              .update({ pantry_confirmed: true, checked: true })
              .eq('id', item.groceryItemId);
          } else if (item.status === 'partial' && item.amountHave !== undefined) {
            const remaining = (item.amount ?? 0) - item.amountHave;
            if (remaining <= 0) {
              await supabase.from('grocery_items').delete().eq('id', item.groceryItemId);
            } else {
              await supabase
                .from('grocery_items')
                .update({ pantry_confirmed: true, amount: remaining })
                .eq('id', item.groceryItemId);
            }
          } else {
            // 'need' or unacted — confirm pantry check but keep on list
            await supabase
              .from('grocery_items')
              .update({ pantry_confirmed: true })
              .eq('id', item.groceryItemId);
          }
        }),
      );

      await supabase
        .from('grocery_lists')
        .update({ pantry_checked_at: new Date().toISOString() })
        .eq('id', listId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.grocery.week(householdId, weekStart),
      });
    },
  });
}
