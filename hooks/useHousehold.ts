'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

export interface HouseholdMembership {
  role: 'owner' | 'member';
  household: {
    id: string;
    name: string;
    invite_code: string;
    owner_id: string;
  };
  members: {
    id: string;
    user_id: string;
    role: 'owner' | 'member';
    joined_at: string;
    profile: {
      display_name: string;
      avatar_url: string | null;
    };
  }[];
}

// ─── Shared types ─────────────────────────────────────────────────────────────

type RawMembershipRow = {
  role: string;
  household:
    | { id: string; name: string; invite_code: string; owner_id: string }
    | { id: string; name: string; invite_code: string; owner_id: string }[]
    | null;
};

type RawMember = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile:
    | { display_name: string; avatar_url: string | null }
    | { display_name: string; avatar_url: string | null }[]
    | null;
};

// ─── Helper: build full HouseholdMembership from a raw row ───────────────────

async function buildMembership(
  raw: RawMembershipRow,
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<HouseholdMembership | null> {
  const household = !raw.household
    ? null
    : Array.isArray(raw.household)
      ? raw.household[0]
      : raw.household;

  if (!household) return null;

  const { data: membersRaw, error: membersError } = await supabase
    .from('household_members')
    .select('id, user_id, role, joined_at, profile:profiles(display_name, avatar_url)')
    .eq('household_id', household.id);

  if (membersError) throw membersError;

  return {
    role: raw.role as 'owner' | 'member',
    household,
    members: ((membersRaw as unknown as RawMember[]) ?? []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role as 'owner' | 'member',
      joined_at: m.joined_at,
      profile: !m.profile
        ? { display_name: 'Unknown', avatar_url: null }
        : Array.isArray(m.profile)
          ? m.profile[0]
          : m.profile,
    })),
  };
}

// ─── useHouseholds — all memberships for the current user ────────────────────

export function useHouseholds() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.household.all(),
    enabled: !!user,
    queryFn: async (): Promise<HouseholdMembership[]> => {
      const supabase = getSupabaseClient();

      const { data: rows, error } = await supabase
        .from('household_members')
        .select('role, household:households(id, name, invite_code, owner_id)')
        .eq('user_id', user!.id);

      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      const results = await Promise.all(
        (rows as unknown as RawMembershipRow[]).map((row) =>
          buildMembership(row, supabase),
        ),
      );
      return results.filter((m): m is HouseholdMembership => m !== null);
    },
  });
}

// ─── useHousehold — single active household ──────────────────────────────────

export function useHousehold() {
  const user = useAuthStore((s) => s.user);
  const activeHouseholdId = useAuthStore((s) => s.activeHouseholdId);

  return useQuery({
    queryKey: queryKeys.household.current(),
    enabled: !!user,
    queryFn: async (): Promise<HouseholdMembership | null> => {
      const supabase = getSupabaseClient();

      const baseQuery = supabase
        .from('household_members')
        .select('role, household:households(id, name, invite_code, owner_id)')
        .eq('user_id', user!.id);

      // If activeHouseholdId is set, filter to that household; otherwise use any (first)
      const { data: rows, error } = activeHouseholdId
        ? await baseQuery.eq('household_id', activeHouseholdId).limit(1)
        : await baseQuery.limit(1);

      if (error) throw error;
      if (!rows || rows.length === 0) return null;

      return buildMembership((rows as unknown as RawMembershipRow[])[0], supabase);
    },
  });
}
