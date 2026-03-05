'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useHousehold } from './useHousehold';
import type { CuisineType, CarbType, ProteinType, IngredientUnit, StorageLocation } from '@/lib/supabase/types';

// ─── Shared recipe types ──────────────────────────────────────────────────────

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: CuisineType;
  carb_type: CarbType;
  protein_type: ProteinType;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  estimated_price: number | null;
  emoji: string;
  bg_color: string;
  advance_prep_days: number;
  advance_prep_note: string | null;
  is_global: boolean;
  household_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  storage_location: StorageLocation;
  sort_order: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_order: number;
  instruction: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

// ─── List hook ────────────────────────────────────────────────────────────────

/**
 * Fetches all recipes visible to the current user:
 * - Global recipes (is_global = true)
 * - Household recipes (household_id = current household)
 *
 * Enabled even without a household — guests see global recipes only.
 */
export function useRecipes() {
  const { data: membership } = useHousehold();
  const householdId = (membership as unknown as { household?: { id: string } } | null)?.household?.id ?? null;

  return useQuery({
    queryKey: queryKeys.recipes.all(householdId ?? 'global'),
    queryFn: async (): Promise<Recipe[]> => {
      const supabase = getSupabaseClient();

      const q = supabase
        .from('recipes')
        .select(
          'id, title, description, cuisine, carb_type, protein_type, prep_time_min, cook_time_min, servings, estimated_price, emoji, bg_color, advance_prep_days, advance_prep_note, is_global, household_id, created_by, created_at, updated_at'
        )
        .order('created_at', { ascending: true });

      const { data, error } = householdId
        ? await q.or(`is_global.eq.true,household_id.eq.${householdId}`)
        : await q.eq('is_global', true);

      if (error) throw error;
      return (data ?? []) as unknown as Recipe[];
    },
  });
}

// ─── Detail hook ──────────────────────────────────────────────────────────────

export function useRecipeDetail(recipeId: string | null) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(recipeId ?? ''),
    enabled: !!recipeId,
    queryFn: async (): Promise<RecipeDetail> => {
      const supabase = getSupabaseClient();

      const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipeId!).single(),
        supabase
          .from('recipe_ingredients')
          .select('*')
          .eq('recipe_id', recipeId!)
          .order('sort_order', { ascending: true }),
        supabase
          .from('recipe_steps')
          .select('*')
          .eq('recipe_id', recipeId!)
          .order('step_order', { ascending: true }),
      ]);

      if (recipeRes.error) throw recipeRes.error;

      return {
        ...(recipeRes.data as unknown as Recipe),
        ingredients: (ingredientsRes.data ?? []) as unknown as RecipeIngredient[],
        steps: (stepsRes.data ?? []) as unknown as RecipeStep[],
      };
    },
  });
}

// ─── Create/Edit mutation ─────────────────────────────────────────────────────

export interface RecipeWritePayload {
  title: string;
  description: string;
  cuisine: CuisineType;
  carb_type: CarbType;
  protein_type: ProteinType;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  emoji: string;
  bg_color: string;
  advance_prep_days: number;
  advance_prep_note: string;
  household_id: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: IngredientUnit;
    storage_location: StorageLocation;
    sort_order: number;
  }>;
  steps: Array<{ instruction: string; step_order: number }>;
}

export function useCreateRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecipeWritePayload) => {
      const supabase = getSupabaseClient();

      // Verify session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert recipe
      const { data: recipeRaw, error: recipeErr } = await supabase
        .from('recipes')
        .insert({
          title: payload.title,
          description: payload.description,
          cuisine: payload.cuisine,
          carb_type: payload.carb_type,
          protein_type: payload.protein_type,
          prep_time_min: payload.prep_time_min,
          cook_time_min: payload.cook_time_min,
          servings: payload.servings,
          emoji: payload.emoji,
          bg_color: payload.bg_color,
          advance_prep_days: payload.advance_prep_days,
          advance_prep_note: payload.advance_prep_note || null,
          is_global: false,
          household_id: payload.household_id,
          created_by: user.id,
        } as never)
        .select('id')
        .single();

      if (recipeErr) throw recipeErr;
      const recipe = recipeRaw as unknown as { id: string };

      // Insert ingredients + steps in parallel
      const [ingErr, stepErr] = await Promise.all([
        payload.ingredients.length > 0
          ? supabase
              .from('recipe_ingredients')
              .insert(
                payload.ingredients.map((ing) => ({
                  recipe_id: recipe.id,
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                  storage_location: ing.storage_location,
                  sort_order: ing.sort_order,
                } as never))
              )
              .then(({ error }) => error)
          : Promise.resolve(null),
        payload.steps.length > 0
          ? supabase
              .from('recipe_steps')
              .insert(
                payload.steps.map((step) => ({
                  recipe_id: recipe.id,
                  instruction: step.instruction,
                  step_order: step.step_order,
                } as never))
              )
              .then(({ error }) => error)
          : Promise.resolve(null),
      ]);

      if (ingErr) throw ingErr;
      if (stepErr) throw stepErr;

      return recipe.id;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all(variables.household_id) });
    },
  });
}

export function useUpdateRecipe(recipeId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecipeWritePayload) => {
      const supabase = getSupabaseClient();

      const { error: recipeErr } = await supabase
        .from('recipes')
        .update({
          title: payload.title,
          description: payload.description,
          cuisine: payload.cuisine,
          carb_type: payload.carb_type,
          protein_type: payload.protein_type,
          prep_time_min: payload.prep_time_min,
          cook_time_min: payload.cook_time_min,
          servings: payload.servings,
          emoji: payload.emoji,
          bg_color: payload.bg_color,
          advance_prep_days: payload.advance_prep_days,
          advance_prep_note: payload.advance_prep_note || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', recipeId);

      if (recipeErr) throw recipeErr;

      // Replace ingredients: delete all then re-insert
      const { error: delIngErr } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);
      if (delIngErr) throw delIngErr;

      const { error: delStepErr } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', recipeId);
      if (delStepErr) throw delStepErr;

      const [ingErr, stepErr] = await Promise.all([
        payload.ingredients.length > 0
          ? supabase
              .from('recipe_ingredients')
              .insert(
                payload.ingredients.map((ing) => ({
                  recipe_id: recipeId,
                  name: ing.name,
                  amount: ing.amount,
                  unit: ing.unit,
                  storage_location: ing.storage_location,
                  sort_order: ing.sort_order,
                } as never))
              )
              .then(({ error }) => error)
          : Promise.resolve(null),
        payload.steps.length > 0
          ? supabase
              .from('recipe_steps')
              .insert(
                payload.steps.map((step) => ({
                  recipe_id: recipeId,
                  instruction: step.instruction,
                  step_order: step.step_order,
                } as never))
              )
              .then(({ error }) => error)
          : Promise.resolve(null),
      ]);

      if (ingErr) throw ingErr;
      if (stepErr) throw stepErr;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all(variables.household_id) });
      qc.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) });
    },
  });
}
