'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface LibraryIngredient {
  id: string;
  name: string;
  default_unit: string | null;
  storage_category: string | null;
}

export function useIngredientLibrary() {
  return useQuery({
    queryKey: queryKeys.ingredientLibrary.list(),
    staleTime: 1000 * 60 * 60, // 1 hour — global seeds rarely change
    queryFn: async (): Promise<LibraryIngredient[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('ingredient_library')
        .select('id, name, default_unit, storage_category')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LibraryIngredient[];
    },
  });
}
