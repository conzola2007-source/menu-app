'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

export interface JoinRequest {
  id: string;
  household_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'denied';
  created_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// ── useJoinRequests — pending requests for a household (owner only) ───────────

export function useJoinRequests(householdId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!householdId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`join_requests:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests', filter: `household_id=eq.${householdId}` },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.joinRequests.list(householdId) });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [householdId, qc]);

  return useQuery({
    queryKey: queryKeys.joinRequests.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<JoinRequest[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('join_requests')
        .select('id, household_id, user_id, status, created_at, profile:profiles(display_name, avatar_url)')
        .eq('household_id', householdId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        const profile = row.profile;
        return {
          id: row.id as string,
          household_id: row.household_id as string,
          user_id: row.user_id as string,
          status: row.status as JoinRequest['status'],
          created_at: row.created_at as string,
          profile: Array.isArray(profile) ? (profile[0] ?? null) : (profile as JoinRequest['profile']),
        };
      });
    },
  });
}

// ── useSendJoinRequest ────────────────────────────────────────────────────────

export function useSendJoinRequest() {
  return useMutation({
    mutationFn: async ({ householdId }: { householdId: string }) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('join_requests')
        .insert({ household_id: householdId, user_id: user.id });

      if (error) throw error;
    },
  });
}

// ── useAcceptJoinRequest ──────────────────────────────────────────────────────

export type VisitorExpiry =
  | { type: 'duration'; value: number; unit: 'minutes' | 'hours' | 'days' | 'months' | 'years' }
  | { type: 'until'; iso: string };

export interface AcceptJoinRequestVars {
  requestId: string;
  assignRole?: 'head_of_household' | 'visitor_head' | 'member' | 'visitor';
  visitorExpiry?: VisitorExpiry;
}

function computeExpiryIso(expiry: VisitorExpiry): string {
  if (expiry.type === 'until') return expiry.iso;
  const now = Date.now();
  const ms = (() => {
    switch (expiry.unit) {
      case 'minutes': return expiry.value * 60_000;
      case 'hours':   return expiry.value * 3_600_000;
      case 'days':    return expiry.value * 86_400_000;
      case 'months':  return expiry.value * 30 * 86_400_000;
      case 'years':   return expiry.value * 365 * 86_400_000;
    }
  })();
  return new Date(now + ms).toISOString();
}

export function useAcceptJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, assignRole = 'member', visitorExpiry }: AcceptJoinRequestVars) => {
      const supabase = getSupabaseClient();
      const isVisitor = assignRole === 'visitor' || assignRole === 'visitor_head';
      const visitorExpiresAt = isVisitor && visitorExpiry ? computeExpiryIso(visitorExpiry) : null;
      const { error } = await supabase.rpc('accept_join_request', {
        request_id: requestId,
        assign_role: assignRole,
        visitor_expires_at: visitorExpiresAt ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, _vars, _ctx) => {
      const activeHouseholdId = useAuthStore.getState().activeHouseholdId;
      void queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.current(activeHouseholdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.all() });
    },
  });
}

// ── useDenyJoinRequest ────────────────────────────────────────────────────────

export function useDenyJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('deny_join_request', { request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['joinRequests'] });
    },
  });
}

// ── useRemoveMember ───────────────────────────────────────────────────────────

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId, householdId }: { targetUserId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.rpc('remove_household_member', {
        target_user_id: targetUserId,
        hh_id: householdId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const activeHouseholdId = useAuthStore.getState().activeHouseholdId;
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.current(activeHouseholdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.all() });
    },
  });
}
