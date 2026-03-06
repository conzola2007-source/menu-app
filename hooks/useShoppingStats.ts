'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface ShoppingStat {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  trip_count: number;
}

export interface ShoppingStats {
  total_trips: number;
  shoppers: ShoppingStat[];
}

export function useShoppingStats(householdId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.shoppingStats.get(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<ShoppingStats> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('shopping_attendance')
        .select(`
          grocery_list_id,
          user_id,
          grocery_list:grocery_lists!inner(household_id),
          profile:profiles!user_id(display_name, avatar_url)
        `)
        .eq('grocery_list.household_id', householdId!);

      if (error) throw error;

      const rows = (data ?? []) as unknown[];

      // Count distinct grocery_list_ids for total trips
      const listIds = new Set(rows.map((r) => (r as Record<string, unknown>).grocery_list_id as string));
      const total_trips = listIds.size;

      // Aggregate per user
      const countMap = new Map<string, ShoppingStat>();
      for (const row of rows) {
        const r = row as Record<string, unknown>;
        const userId = r.user_id as string;
        const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
        const p = (profile ?? {}) as Record<string, unknown>;

        if (!countMap.has(userId)) {
          countMap.set(userId, {
            user_id: userId,
            display_name: (p.display_name as string) ?? 'Unknown',
            avatar_url: (p.avatar_url as string | null) ?? null,
            trip_count: 0,
          });
        }
        countMap.get(userId)!.trip_count += 1;
      }

      const shoppers = Array.from(countMap.values()).sort(
        (a, b) => b.trip_count - a.trip_count,
      );

      return { total_trips, shoppers };
    },
  });
}
