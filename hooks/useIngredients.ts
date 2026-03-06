'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { IngredientUnit } from '@/lib/supabase/types';

export interface Ingredient {
  id: string;
  household_id: string;
  name: string;
  default_unit: IngredientUnit;
  price: number | null;
  pack_qty: number | null;
  pack_price: number | null;
  per_unit_cost: number | null;
  created_by: string | null;
  created_at: string;
}

export function useIngredients(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.ingredients.all(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<Ingredient[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('household_id', householdId!)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Ingredient[];
    },
  });
}

export function useCreateIngredient(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      default_unit: IngredientUnit;
      pack_qty?: number | null;
      pack_price?: number | null;
    }) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          household_id: householdId,
          name: payload.name.trim(),
          default_unit: payload.default_unit,
          pack_qty: payload.pack_qty ?? null,
          pack_price: payload.pack_price ?? null,
          created_by: user?.id ?? null,
        } as never)
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as Ingredient;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.ingredients.all(householdId) });
    },
  });
}

export function useUpdateIngredient(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      default_unit?: IngredientUnit;
      pack_qty?: number | null;
      pack_price?: number | null;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('ingredients')
        .update({
          default_unit: payload.default_unit,
          pack_qty: payload.pack_qty,
          pack_price: payload.pack_price,
        } as never)
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.ingredients.all(householdId) });
    },
  });
}
