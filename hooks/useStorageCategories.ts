'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface StorageCategory {
  id: string;
  household_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export function useStorageCategories(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.storageCategories.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<StorageCategory[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('household_storage_categories')
        .select('*')
        .eq('household_id', householdId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StorageCategory[];
    },
  });
}

export function useAddStorageCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, name }: { householdId: string; name: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('household_storage_categories')
        .insert({ household_id: householdId, name: name.trim() } as never);
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: (_, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.storageCategories.list(householdId) });
    },
  });
}

export function useDeleteStorageCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, householdId }: { id: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('household_storage_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return householdId;
    },
    onSuccess: (householdId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.storageCategories.list(householdId) });
    },
  });
}
