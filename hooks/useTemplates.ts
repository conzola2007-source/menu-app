'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateSlot {
  id: string;
  template_id: string;
  recipe_id: string;
  day_offset: number;
  sort_order: number;
  recipe: {
    id: string;
    title: string;
    emoji: string;
    bg_color: string;
  };
}

export interface Template {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  duration_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  slots: TemplateSlot[];
}

// ─── useTemplates ─────────────────────────────────────────────────────────────

export function useTemplates(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.templates.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<Template[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('meal_plan_templates')
        .select(`
          *,
          slots:meal_plan_template_slots(
            *,
            recipe:recipes(id, title, emoji, bg_color)
          )
        `)
        .eq('household_id', householdId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Template[];
    },
  });
}

// ─── useSaveTemplate ─────────────────────────────────────────────────────────

export function useSaveTemplate() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      householdId,
      name,
      description,
      durationDays,
      slots,
    }: {
      householdId: string;
      name: string;
      description: string;
      durationDays: number;
      slots: { recipeId: string; dayOffset: number; sortOrder: number }[];
    }) => {
      const supabase = getSupabaseClient();

      const { data: template, error: tErr } = await supabase
        .from('meal_plan_templates')
        .insert({
          household_id: householdId,
          name,
          description: description || null,
          duration_days: durationDays,
          created_by: user?.id ?? null,
        })
        .select('id')
        .single();
      if (tErr) throw tErr;

      if (slots.length > 0) {
        const { error: sErr } = await supabase.from('meal_plan_template_slots').insert(
          slots.map((s) => ({
            template_id: template.id,
            recipe_id: s.recipeId,
            day_offset: s.dayOffset,
            sort_order: s.sortOrder,
          })),
        );
        if (sErr) throw sErr;
      }

      return template.id;
    },
    onSuccess: (_data, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.templates.list(householdId) });
    },
  });
}

// ─── useDeleteTemplate ────────────────────────────────────────────────────────

export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, householdId }: { templateId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('meal_plan_templates')
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: (_data, { householdId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.templates.list(householdId) });
    },
  });
}
