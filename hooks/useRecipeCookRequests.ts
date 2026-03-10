'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecipeCookRequest {
  id: string;
  recipe_id: string;
  requester_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  recipe: { title: string; emoji: string } | null;
  requester_profile: { display_name: string; avatar_url: string | null } | null;
}

// ─── useMyRecipeCookRequests — pending requests for recipes I own ─────────────

export function useMyRecipeCookRequests(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`recipe_cook_requests:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipe_cook_requests', filter: `owner_id=eq.${userId}` },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.recipeCookRequests.mine(userId) });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, qc]);

  return useQuery({
    queryKey: queryKeys.recipeCookRequests.mine(userId ?? ''),
    enabled: !!userId,
    queryFn: async (): Promise<RecipeCookRequest[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipe_cook_requests')
        .select(`
          id, recipe_id, requester_id, owner_id, status, created_at,
          recipe:recipes(title, emoji),
          requester_profile:profiles!requester_id(display_name, avatar_url)
        `)
        .eq('owner_id', userId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown[]).map((r) => {
        const row = r as Record<string, unknown>;
        const recipe = row.recipe;
        const rp = row.requester_profile;
        return {
          id: row.id as string,
          recipe_id: row.recipe_id as string,
          requester_id: row.requester_id as string,
          owner_id: row.owner_id as string,
          status: row.status as RecipeCookRequest['status'],
          created_at: row.created_at as string,
          recipe: Array.isArray(recipe) ? (recipe[0] ?? null) : (recipe as RecipeCookRequest['recipe']),
          requester_profile: Array.isArray(rp) ? (rp[0] ?? null) : (rp as RecipeCookRequest['requester_profile']),
        };
      });
    },
  });
}

// ─── useSendRecipeCookRequest — insert a copy request ────────────────────────

export function useSendRecipeCookRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipeId,
      requesterId,
      ownerId,
    }: {
      recipeId: string;
      requesterId: string;
      ownerId: string;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_cook_requests')
        .insert({ recipe_id: recipeId, requester_id: requesterId, owner_id: ownerId } as never);
      // Ignore unique conflict (already requested)
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: (_data, { ownerId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeCookRequests.mine(ownerId) });
    },
  });
}

// ─── useApproveRecipeCookRequest — deep-copy recipe to requester ──────────────

export function useApproveRecipeCookRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      recipeId,
      requesterId,
      ownerId,
    }: {
      requestId: string;
      recipeId: string;
      requesterId: string;
      ownerId: string;
    }) => {
      const supabase = getSupabaseClient();

      // Fetch source recipe + ingredients + steps in parallel
      const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipeId).single(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', recipeId).order('sort_order'),
        supabase.from('recipe_steps').select('*').eq('recipe_id', recipeId).order('step_order'),
      ]);
      if (recipeRes.error) throw recipeRes.error;

      const src = recipeRes.data as Record<string, unknown>;

      // Insert copy owned by requester (no household — personal recipe)
      const { data: newRecipe, error: insertErr } = await supabase
        .from('recipes')
        .insert({
          title: src.title,
          description: src.description ?? '',
          cuisine: src.cuisine,
          carb_type: src.carb_type,
          protein_type: src.protein_type,
          prep_time_min: src.prep_time_min ?? 0,
          cook_time_min: src.cook_time_min ?? 0,
          servings: src.servings ?? 4,
          emoji: src.emoji,
          bg_color: src.bg_color,
          advance_prep_days: src.advance_prep_days ?? 0,
          advance_prep_note: src.advance_prep_note ?? null,
          is_global: false,
          household_id: src.household_id, // keep same household context
          created_by: requesterId,
        } as never)
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      const newId = (newRecipe as { id: string }).id;
      const ingredients = ingredientsRes.data ?? [];
      const steps = stepsRes.data ?? [];

      // Copy ingredients + steps
      await Promise.all([
        ingredients.length > 0
          ? supabase.from('recipe_ingredients').insert(
              ingredients.map((ing) => ({
                recipe_id: newId,
                name: (ing as Record<string, unknown>).name,
                amount: (ing as Record<string, unknown>).amount,
                unit: (ing as Record<string, unknown>).unit,
                storage_location: (ing as Record<string, unknown>).storage_location,
                sort_order: (ing as Record<string, unknown>).sort_order,
              } as never))
            )
          : Promise.resolve({ error: null }),
        steps.length > 0
          ? supabase.from('recipe_steps').insert(
              steps.map((step) => ({
                recipe_id: newId,
                instruction: (step as Record<string, unknown>).instruction,
                step_order: (step as Record<string, unknown>).step_order,
              } as never))
            )
          : Promise.resolve({ error: null }),
      ]);

      // Mark request approved
      const { error: updateErr } = await supabase
        .from('recipe_cook_requests')
        .update({ status: 'approved' } as never)
        .eq('id', requestId);
      if (updateErr) throw updateErr;

      return { ownerId };
    },
    onSuccess: (_data, { ownerId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeCookRequests.mine(ownerId) });
    },
  });
}

// ─── useDenyRecipeCookRequest ─────────────────────────────────────────────────

export function useDenyRecipeCookRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ownerId }: { requestId: string; ownerId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipe_cook_requests')
        .update({ status: 'denied' } as never)
        .eq('id', requestId);
      if (error) throw error;
      return { ownerId };
    },
    onSuccess: (_data, { ownerId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.recipeCookRequests.mine(ownerId) });
    },
  });
}
