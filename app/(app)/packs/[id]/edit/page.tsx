'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { usePacks, useUpdatePack, useAddPackItem, useRemovePackItem } from '@/hooks/usePacks';
import { useHouseholdPool } from '@/hooks/useRecipes';
import { isHead } from '@/lib/roles';

export default function EditPackPage() {
  const { id: packId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? null;
  const currentUserIsHead = membership ? isHead(membership.role) : false;
  const { data: packs = [] } = usePacks(householdId);
  const { data: poolRecipes = [] } = useHouseholdPool(householdId);
  const updatePack = useUpdatePack();
  const addPackItem = useAddPackItem();
  const removePackItem = useRemovePackItem();

  const pack = packs.find((p) => p.id === packId) ?? null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form once pack data loads
  useEffect(() => {
    if (pack) {
      setName(pack.name);
      setDescription(pack.description ?? '');
      setSelectedRecipeIds(new Set(pack.items.map((item) => item.recipe_id)));
    }
  }, [pack?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUserIsHead) {
    router.replace('/packs');
    return null;
  }

  function toggleRecipe(recipeId: string) {
    setSelectedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!householdId || !packId || !name.trim() || !pack) return;
    setSubmitting(true);
    setError('');
    try {
      // Update name/description
      await updatePack.mutateAsync({
        packId,
        householdId,
        name: name.trim(),
        description: description.trim() || null,
      });

      // Sync recipe items
      const existingIds = new Set(pack.items.map((item) => item.recipe_id));
      const toAdd = Array.from(selectedRecipeIds).filter((id) => !existingIds.has(id));
      const toRemove = pack.items.filter((item) => !selectedRecipeIds.has(item.recipe_id));

      await Promise.all([
        ...toAdd.map((recipeId) =>
          addPackItem.mutateAsync({ packId, recipeId, householdId }),
        ),
        ...toRemove.map((item) =>
          removePackItem.mutateAsync({ itemId: item.id, householdId }),
        ),
      ]);

      router.replace('/packs');
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state while packs are fetched
  if (!pack && packs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-primary" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
        <span className="text-4xl">😕</span>
        <p className="text-white">Pack not found.</p>
        <button type="button" onClick={() => router.replace('/packs')} className="text-sm text-primary hover:underline">
          Back to packs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <button type="button" onClick={() => router.replace('/packs')} className="text-slate-400 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-white">Edit pack</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Pack name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quick weeknight meals"
            maxLength={60}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description…"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Recipe picker */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">
            Recipes ({selectedRecipeIds.size} selected)
          </p>
          <div className="flex flex-col gap-2">
            {poolRecipes.map((recipe) => {
              const selected = selectedRecipeIds.has(recipe.id);
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => toggleRecipe(recipe.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: recipe.bg_color }}
                  >
                    {recipe.emoji}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white">{recipe.title}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
            {poolRecipes.length === 0 && (
              <p className="text-sm text-slate-500">No recipes in household pool yet.</p>
            )}
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || submitting}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
