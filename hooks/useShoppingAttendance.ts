'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShoppingAttendance {
  id: string;
  grocery_list_id: string;
  user_id: string;
  marked_at: string;
}

// ─── useShoppingAttendance ────────────────────────────────────────────────────

export function useShoppingAttendance(listId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!listId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`shopping_attendance:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_attendance',
          filter: `grocery_list_id=eq.${listId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: queryKeys.shoppingAttendance.list(listId),
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listId, qc]);

  return useQuery({
    queryKey: queryKeys.shoppingAttendance.list(listId ?? ''),
    enabled: !!listId,
    queryFn: async (): Promise<ShoppingAttendance[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('shopping_attendance')
        .select('id, grocery_list_id, user_id, marked_at')
        .eq('grocery_list_id', listId!);
      if (error) throw error;
      return (data ?? []) as unknown as ShoppingAttendance[];
    },
  });
}

// ─── useMarkComingShopping ────────────────────────────────────────────────────

export function useMarkComingShopping() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (listId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('shopping_attendance').insert({
        grocery_list_id: listId,
        user_id: user!.id,
      } as never);
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: (_, listId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.shoppingAttendance.list(listId) });
    },
  });
}

// ─── useUnmarkComingShopping ──────────────────────────────────────────────────

export function useUnmarkComingShopping() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (listId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('shopping_attendance')
        .delete()
        .eq('grocery_list_id', listId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_, listId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.shoppingAttendance.list(listId) });
    },
  });
}
