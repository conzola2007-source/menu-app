'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { useHousehold } from './useHousehold';
import { useAuthStore } from '@/stores/authStore';
import type { CuisineType, CarbType, ProteinType, IngredientUnit, StorageLocation } from '@/lib/supabase/types';

// ─── Shared recipe types ──────────────────────────────────────────────────────

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: CuisineType;
  carb_type: CarbType;
  protein_type: ProteinType;
  dietary_tags: string[];
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

// ─── List hook (personal library) ─────────────────────────────────────────────

/**
 * Personal recipe library: recipes the user created + global recipes they
 * explicitly saved during onboarding (user_saved_global_recipes).
 * Used on the /recipes page. Does NOT represent the household pool.
 */
export function useRecipes() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: queryKeys.recipes.all(user?.id ?? 'anon'),
    queryFn: async (): Promise<Recipe[]> => {
      const supabase = getSupabaseClient();
      const selectFields =
        'id, title, description, cuisine, carb_type, protein_type, dietary_tags, prep_time_min, cook_time_min, servings, estimated_price, emoji, bg_color, advance_prep_days, advance_prep_note, is_global, household_id, created_by, created_at, updated_at';

      if (!user) {
        // Guest: show all global recipes
        const { data, error } = await supabase
          .from('recipes')
          .select(selectFields)
          .eq('is_global', true)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return (data ?? []) as unknown as Recipe[];
      }

      // Authenticated: show user-created + explicitly saved global recipes
      const { data: saved } = await supabase
        .from('user_saved_global_recipes')
        .select('recipe_id')
        .eq('user_id', user.id);
      const savedIds = (saved ?? []).map(
        (r: { recipe_id: string }) => r.recipe_id,
      );

      const filter =
        savedIds.length > 0
          ? `created_by.eq.${user.id},id.in.(${savedIds.join(',')})`
          : `created_by.eq.${user.id}`;

      const { data, error } = await supabase
        .from('recipes')
        .select(selectFields)
        .or(filter)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Recipe[];
    },
    enabled: true,
  });
}

// ─── Household pool hook ───────────────────────────────────────────────────────

/**
 * The household recipe pool: recipes explicitly added to household_recipes + global recipes.
 * Used by the vote page and plan page recipe picker.
 */
export function useHouseholdPool(householdId: string | null) {
  return useQuery({
    queryKey: queryKeys.householdPool.list(householdId ?? ''),
    enabled: !!householdId,
    queryFn: async (): Promise<Recipe[]> => {
      const supabase = getSupabaseClient();

      // Get recipe IDs explicitly added to this household pool
      const { data: poolRows, error: poolErr } = await supabase
        .from('household_recipes')
        .select('recipe_id')
        .eq('household_id', householdId!);
      if (poolErr) throw poolErr;

      const poolIds = (poolRows ?? []).map(
        (r) => (r as unknown as { recipe_id: string }).recipe_id,
      );

      // Empty pool → no recipes
      if (poolIds.length === 0) return [];

      // Fetch only the explicitly pooled recipes
      const { data, error } = await supabase
        .from('recipes')
        .select(
          'id, title, description, cuisine, carb_type, protein_type, dietary_tags, prep_time_min, cook_time_min, servings, estimated_price, emoji, bg_color, advance_prep_days, advance_prep_note, is_global, household_id, created_by, created_at, updated_at',
        )
        .in('id', poolIds)
        .order('created_at', { ascending: true });
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
    pack_qty?: number | null;
    pack_price?: number | null;
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
                  pack_qty: ing.pack_qty ?? null,
                  pack_price: ing.pack_price ?? null,
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

      // Auto-add to household pool so it shows up in voting
      if (payload.household_id) {
        await supabase
          .from('household_recipes')
          .insert({ household_id: payload.household_id, recipe_id: recipe.id, added_by: user.id } as never)
          .then(() => void 0);
      }

      return recipe.id;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all(variables.household_id) });
      qc.invalidateQueries({ queryKey: queryKeys.householdPool.list(variables.household_id) });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ recipeId }: { recipeId: string; householdId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('created_by', user!.id); // guard: only own recipes
      if (error) throw error;
    },
    onSuccess: (_, { householdId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all(user?.id ?? '') });
      qc.invalidateQueries({ queryKey: queryKeys.householdPool.list(householdId) });
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
                  pack_qty: ing.pack_qty ?? null,
                  pack_price: ing.pack_price ?? null,
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
