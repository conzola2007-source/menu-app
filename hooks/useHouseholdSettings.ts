'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface HouseholdSettings {
  week_start_day: number;       // 0=Sun, 1=Mon
  dinner_time: string;          // 'HH:MM'
  default_duration_days: number;
}

export function useHouseholdSettings(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.householdSettings.get(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<HouseholdSettings> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('households')
        .select('week_start_day, dinner_time, default_duration_days')
        .eq('id', householdId!)
        .single();
      if (error) throw error;
      return data as unknown as HouseholdSettings;
    },
  });
}

export function useUpdateHouseholdSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      householdId,
      settings,
    }: {
      householdId: string;
      settings: Partial<HouseholdSettings>;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('households')
        .update(settings as never)
        .eq('id', householdId);
      if (error) throw error;
    },
    onSuccess: (_, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.householdSettings.get(householdId) });
      void qc.invalidateQueries({ queryKey: queryKeys.household.current() });
    },
  });
}
