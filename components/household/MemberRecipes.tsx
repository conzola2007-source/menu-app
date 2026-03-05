'use client';

import { useState } from 'react';
import { X, ChefHat, Copy, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from './MemberList';

interface MemberRecipesProps {
  member: {
    user_id: string;
    name: string;
    avatarUrl: string | null;
  };
  currentUserId: string;
  householdId: string;
  onClose: () => void;
}

interface MiniRecipe {
  id: string;
  title: string;
  emoji: string;
  bg_color: string;
  cuisine: string;
  created_by: string | null;
}

export function MemberRecipes({ member, currentUserId, householdId, onClose }: MemberRecipesProps) {
  const queryClient = useQueryClient();
  const [copying, setCopying] = useState<string | null>(null);
  const [copied, setCopied] = useState<Set<string>>(new Set());

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['member-recipes', member.user_id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, emoji, bg_color, cuisine, created_by')
        .eq('created_by', member.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MiniRecipe[];
    },
  });

  async function addToMine(recipe: MiniRecipe) {
    setCopying(recipe.id);
    try {
      const supabase = getSupabaseClient();

      // Fetch full recipe detail
      const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', recipe.id).single(),
        supabase.from('recipe_ingredients').select('*').eq('recipe_id', recipe.id).order('sort_order', { ascending: true }),
        supabase.from('recipe_steps').select('*').eq('recipe_id', recipe.id).order('step_order', { ascending: true }),
      ]);
      if (recipeRes.error) throw recipeRes.error;

      const src = recipeRes.data as Record<string, unknown>;

      // Insert new recipe
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
          household_id: householdId,
          created_by: currentUserId,
        } as never)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      const newId = (newRecipe as { id: string }).id;

      // Copy ingredients + steps
      const ingredients = ingredientsRes.data ?? [];
      const steps = stepsRes.data ?? [];

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

      setCopied((prev) => new Set([...prev, recipe.id]));
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all(householdId) });
    } catch (err) {
      console.error('[MemberRecipes] addToMine error:', err);
    } finally {
      setCopying(null);
    }
  }

  const isOwnProfile = member.user_id === currentUserId;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Avatar name={member.name} size="sm" avatarUrl={member.avatarUrl} />
          <span className="flex-1 text-sm font-semibold text-white">
            {isOwnProfile ? 'Your recipes' : `${member.name}'s recipes`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : !recipes?.length ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ChefHat className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">No recipes yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recipes.map((r) => {
                const alreadyCopied = copied.has(r.id);
                const isCopying = copying === r.id;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ backgroundColor: r.bg_color }}
                    >
                      {r.emoji}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-white">
                      {r.title}
                    </span>
                    <span className="shrink-0 text-xs capitalize text-slate-500">{r.cuisine}</span>
                    {!isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => void addToMine(r)}
                        disabled={isCopying || alreadyCopied}
                        className="ml-1 flex shrink-0 items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                        title="Add a copy to your recipes"
                      >
                        {alreadyCopied ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {alreadyCopied ? 'Added' : isCopying ? '…' : 'Add'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
