'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link2 } from 'lucide-react';
import { RecipeForm } from '@/components/recipe/RecipeForm';
import { ImportRecipeSheet } from '@/components/recipe/ImportRecipeSheet';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import type { RecipeFormValues } from '@/components/recipe/RecipeForm';
import type { IngredientUnit, StorageLocation } from '@/lib/supabase/types';
import type { ScrapedRecipe } from '@/lib/recipe-scraper';

export default function NewRecipePage() {
  const router = useRouter();
  const { data: membership } = useHousehold();
  const householdId = (membership as unknown as { household?: { id: string } } | null)?.household?.id;
  const createRecipe = useCreateRecipe();
  const [showImport, setShowImport] = useState(false);
  const [importedDefaults, setImportedDefaults] = useState<Partial<RecipeFormValues> | undefined>();
  // Key forces RecipeForm to remount with fresh defaultValues after import
  const [formKey, setFormKey] = useState(0);

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
        pack_qty: (ing as unknown as { pack_qty?: number | null }).pack_qty ?? null,
        pack_price: (ing as unknown as { pack_price?: number | null }).pack_price ?? null,
      })),
      steps: values.steps.map((step, i) => ({
        instruction: step.instruction,
        step_order: i,
      })),
    });

    router.push(`/recipes/${recipeId}`);
  }

  function handleImported(data: ScrapedRecipe) {
    const defaults: Partial<RecipeFormValues> = {
      title: data.title,
      description: data.description,
      cuisine: data.cuisine,
      prep_time_min: data.prep_time_min || 15,
      cook_time_min: data.cook_time_min || 30,
      servings: data.servings,
      ingredients: data.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        storage_location: 'pantry' as const,
        pack_qty: null,
        pack_price: null,
      })),
      steps: data.steps,
    };
    setImportedDefaults(defaults);
    setFormKey((k) => k + 1); // remount form with new defaults
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
        <h1 className="flex-1 text-base font-semibold text-white">New recipe</h1>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
        >
          <Link2 className="h-3.5 w-3.5" />
          Import URL
        </button>
      </div>

      {importedDefaults && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2 text-xs text-green-400">
          <span>✓ Imported from URL — review and edit below before saving.</span>
          <button
            type="button"
            onClick={() => { setImportedDefaults(undefined); setFormKey((k) => k + 1); }}
            className="ml-auto text-green-600 hover:text-green-400"
          >
            Clear
          </button>
        </div>
      )}

      <div className="px-4 py-4">
        <RecipeForm
          key={formKey}
          importedDefaults={importedDefaults}
          onSubmit={handleSubmit}
          submitLabel="Create recipe"
        />
      </div>

      <ImportRecipeSheet
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImported={handleImported}
      />
    </div>
  );
}
