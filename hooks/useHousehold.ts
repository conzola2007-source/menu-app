'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

import type { MemberRole } from '@/lib/supabase/types';

export interface HouseholdMember {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  is_creator: boolean;
  visitor_expires_at: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface HouseholdMembership {
  role: MemberRole;
  is_creator: boolean;
  visitor_expires_at: string | null;
  household: {
    id: string;
    name: string;
    invite_code: string;
    owner_id: string;
  };
  members: HouseholdMember[];
}

// ─── Shared types ─────────────────────────────────────────────────────────────

type RawMembershipRow = {
  role: string;
  is_creator: boolean;
  visitor_expires_at: string | null;
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
  is_creator: boolean;
  visitor_expires_at: string | null;
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
    .select('id, user_id, role, joined_at, is_creator, visitor_expires_at, profile:profiles(display_name, avatar_url)')
    .eq('household_id', household.id);

  if (membersError) throw membersError;

  return {
    role: raw.role as MemberRole,
    is_creator: raw.is_creator ?? false,
    visitor_expires_at: raw.visitor_expires_at ?? null,
    household,
    members: ((membersRaw as unknown as RawMember[]) ?? []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role as MemberRole,
      joined_at: m.joined_at,
      is_creator: m.is_creator ?? false,
      visitor_expires_at: m.visitor_expires_at ?? null,
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
        .select('role, is_creator, visitor_expires_at, household:households(id, name, invite_code, owner_id)')
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
    queryKey: queryKeys.household.current(activeHouseholdId),
    enabled: !!user,
    queryFn: async (): Promise<HouseholdMembership | null> => {
      const supabase = getSupabaseClient();

      const baseQuery = supabase
        .from('household_members')
        .select('role, is_creator, visitor_expires_at, household:households(id, name, invite_code, owner_id)')
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
