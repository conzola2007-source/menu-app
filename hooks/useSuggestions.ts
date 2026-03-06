'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';

export interface Suggestion {
  id: string;
  household_id: string;
  user_id: string | null;
  content: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  profile: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// ── useSuggestions — pending suggestions for a household (heads only) ─────────

export function useSuggestions(householdId: string | undefined) {
  return useQuery({
    queryKey: ['suggestions', householdId],
    enabled: !!householdId,
    queryFn: async (): Promise<Suggestion[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, household_id, user_id, content, status, created_at, profile:profiles(display_name, avatar_url)')
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
          user_id: row.user_id as string | null,
          content: row.content as string,
          status: row.status as Suggestion['status'],
          created_at: row.created_at as string,
          profile: Array.isArray(profile) ? (profile[0] ?? null) : (profile as Suggestion['profile']),
        };
      });
    },
  });
}

// ── useMySuggestions — all suggestions submitted by current user ───────────────

export function useMySuggestions(householdId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['suggestions', householdId, 'mine', userId],
    enabled: !!householdId && !!userId,
    queryFn: async (): Promise<Suggestion[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, household_id, user_id, content, status, created_at')
        .eq('household_id', householdId!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          household_id: row.household_id as string,
          user_id: row.user_id as string | null,
          content: row.content as string,
          status: row.status as Suggestion['status'],
          created_at: row.created_at as string,
          profile: null,
        };
      });
    },
  });
}

// ── useSubmitSuggestion ───────────────────────────────────────────────────────

export function useSubmitSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, content }: { householdId: string; content: string }) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('suggestions')
        .insert({ household_id: householdId, user_id: user.id, content });

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions', vars.householdId] });
    },
  });
}

// ── useRespondToSuggestion ────────────────────────────────────────────────────

export function useRespondToSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      suggestionId,
      householdId,
      status,
    }: {
      suggestionId: string;
      householdId: string;
      status: 'approved' | 'denied';
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;
      return householdId;
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions', vars.householdId] });
    },
  });
}
