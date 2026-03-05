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

export function useHousehold() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.household.current(),
    enabled: !!user,
    queryFn: async (): Promise<HouseholdMembership | null> => {
      const supabase = getSupabaseClient();

      // Get the user's membership + household
      const { data: membershipRaw, error } = await supabase
        .from('household_members')
        .select('role, household:households(id, name, invite_code, owner_id)')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!membershipRaw) return null;

      // Cast to known shape — Supabase returns joined relations as array or object
      const membershipData = membershipRaw as unknown as {
        role: string;
        household: { id: string; name: string; invite_code: string; owner_id: string } | { id: string; name: string; invite_code: string; owner_id: string }[] | null;
      };

      const household = !membershipData.household
        ? null
        : Array.isArray(membershipData.household)
          ? membershipData.household[0]
          : membershipData.household;

      if (!household) return null;

      // Get all members of this household
      const { data: membersRaw, error: membersError } = await supabase
        .from('household_members')
        .select('id, user_id, role, joined_at, profile:profiles(display_name, avatar_url)')
        .eq('household_id', household.id);

      if (membersError) throw membersError;

      type RawMember = {
        id: string; user_id: string; role: string; joined_at: string;
        profile: { display_name: string; avatar_url: string | null } | { display_name: string; avatar_url: string | null }[] | null;
      };

      return {
        role: membershipData.role as 'owner' | 'member',
        household,
        members: (membersRaw as unknown as RawMember[] ?? []).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as 'owner' | 'member',
          joined_at: m.joined_at,
          profile: !m.profile
            ? { display_name: 'Unknown', avatar_url: null }
            : Array.isArray(m.profile) ? m.profile[0] : m.profile,
        })),
      };
    },
  });
}
