'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RecipeForm } from '@/components/recipe/RecipeForm';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import type { RecipeFormValues } from '@/components/recipe/RecipeForm';
import type { IngredientUnit, StorageLocation } from '@/lib/supabase/types';

export default function NewRecipePage() {
  const router = useRouter();
  const { data: membership } = useHousehold();
  const householdId = (membership as unknown as { household?: { id: string } } | null)?.household?.id;
  const createRecipe = useCreateRecipe();

  async function handleSubmit(values: RecipeFormValues) {
    if (!householdId) throw new Error('No household found. Join or create one first.');

    const recipeId = await createRecipe.mutateAsync({
      title: values.title,
      description: values.description ?? '',
      cuisine: values.cuisine,
      carb_type: values.carb_type,
      protein_type: values.protein_type,
      prep_time_min: values.prep_time_min,
      cook_time_min: values.cook_time_min,
      servings: values.servings,
      emoji: values.emoji,
      bg_color: values.bg_color,
      advance_prep_days: values.advance_prep_days,
      advance_prep_note: values.advance_prep_note ?? '',
      household_id: householdId,
      ingredients: values.ingredients.map((ing, i) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit as IngredientUnit,
        storage_location: ing.storage_location as StorageLocation,
        sort_order: i,
      })),
      steps: values.steps.map((step, i) => ({
        instruction: step.instruction,
        step_order: i,
      })),
    });

    router.push(`/recipes/${recipeId}`);
  }

  if (!householdId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
        <span className="text-4xl">🏠</span>
        <p className="font-medium text-white">You need a household to add recipes</p>
        <p className="text-sm text-slate-400">
          Household recipes belong to a household so your family can share them.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold text-white">New recipe</h1>
      </div>

      <div className="px-4 py-4">
        <RecipeForm onSubmit={handleSubmit} submitLabel="Create recipe" />
      </div>
    </div>
  );
}
