'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, SkipForward, CheckCircle2 } from 'lucide-react';
import { useGroceryList, useBatchConfirmPantry } from '@/hooks/useGroceryList';
import { useGroceryStore } from '@/stores/groceryStore';
import { PantryCheckCard } from '@/components/grocery/PantryCheckCard';
import type { StorageLocation } from '@/lib/supabase/types';
import type { GroceryListItem } from '@/hooks/useGroceryList';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_ORDER: StorageLocation[] = ['freezer', 'fridge', 'pantry', 'other'];

const SECTION_LABELS: Record<StorageLocation, string> = {
  freezer: '🧊 Freezer',
  fridge: '❄️ Fridge',
  pantry: '🥫 Pantry',
  other: '📦 Other',
};

// Map grocery category → storage location for grouping
function categoryToStorage(category: string): StorageLocation {
  switch (category) {
    case 'frozen': return 'freezer';
    case 'dairy-eggs':
    case 'meat-seafood':
    case 'produce': return 'fridge';
    case 'pantry':
    case 'snacks-drinks':
    case 'bakery': return 'pantry';
    default: return 'other';
  }
}

// Build the recipe name(s) for an item from all items in the list
function buildRecipeNames(item: GroceryListItem, allItems: GroceryListItem[]): string[] {
  if (!item.recipe_title) return [];
  // Collect all distinct recipe titles for the same name (may appear in multiple recipes)
  return [
    ...new Set(
      allItems
        .filter((i) => i.name === item.name && i.recipe_title)
        .map((i) => i.recipe_title!),
    ),
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PantryCheckPage() {
  const router = useRouter();
  const { data: groceryData, isLoading } = useGroceryList();
  const batchConfirm = useBatchConfirmPantry();
  const {
    checkItems,
    currentSection,
    isComplete,
    initPantryCheck,
    markHave,
    markNeed,
    markPartial,
    advance,
    reset,
  } = useGroceryStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Initialise on first load ───────────────────────────────────────────────
  useEffect(() => {
    if (!groceryData?.items.length || checkItems.length > 0) return;

    const pantryItems = groceryData.items.map((item) => ({
      groceryItemId: item.id,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      storageLocation: categoryToStorage(item.category),
      recipeNames: buildRecipeNames(item, groceryData.items),
      status: 'pending' as const,
    }));

    // Only include sections that have items
    initPantryCheck(pantryItems);
  }, [groceryData, checkItems.length, initPantryCheck]);

  // ── Current section state ─────────────────────────────────────────────────
  const pendingInSection = checkItems.filter(
    (i) => i.storageLocation === currentSection && i.status === 'pending',
  );
  const totalInSection = checkItems.filter((i) => i.storageLocation === currentSection);
  const doneInSection = totalInSection.length - pendingInSection.length;
  const sectionDone = pendingInSection.length === 0 && totalInSection.length > 0;

  const currentItem = pendingInSection[0];

  // Skip sections that have no items
  const sectionsWithItems = SECTION_ORDER.filter(
    (s) => checkItems.some((i) => i.storageLocation === s),
  );
  const currentSectionIndex = sectionsWithItems.indexOf(currentSection);

  // ── Completion: save results ──────────────────────────────────────────────
  useEffect(() => {
    if (!isComplete || saving || saved || !groceryData?.list) return;
    setSaving(true);

    batchConfirm
      .mutateAsync({ listId: groceryData.list.id, checkItems })
      .then(() => {
        setSaved(true);
        reset();
      })
      .catch(console.error)
      .finally(() => setSaving(false));
  }, [isComplete, saving, saved, groceryData?.list, checkItems, batchConfirm, reset]);

  function handleSkipSection() {
    // Mark all pending in section as 'need', then advance
    const pending = checkItems.filter(
      (i) => i.storageLocation === currentSection && i.status === 'pending',
    );
    for (const item of pending) markNeed(item.groceryItemId);
    advance();
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── No grocery list ────────────────────────────────────────────────────────
  if (!groceryData?.list || groceryData.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🛒</span>
        <p className="font-medium text-white">No grocery list to check</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-400"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Complete: show summary ─────────────────────────────────────────────────
  if (isComplete || saved) {
    const haveCount = checkItems.filter((i) => i.status === 'have').length;
    const partialCount = checkItems.filter((i) => i.status === 'partial').length;
    const needCount = checkItems.filter(
      (i) => i.status === 'need' || i.status === 'pending',
    ).length;

    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/grocery')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-white">Pantry Check</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          {saving ? (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-slate-400">Saving results…</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-14 w-14 text-green-400" />
              <h2 className="text-xl font-bold text-white">All done!</h2>

              <div className="flex flex-col gap-2 text-sm">
                {haveCount > 0 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-base">✓</span>
                    <span>{haveCount} item{haveCount !== 1 ? 's' : ''} already have</span>
                  </div>
                )}
                {partialCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <span className="text-base">½</span>
                    <span>{partialCount} item{partialCount !== 1 ? 's' : ''} partially have</span>
                  </div>
                )}
                {needCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-base">🛒</span>
                    <span>{needCount} item{needCount !== 1 ? 's' : ''} to buy</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push('/grocery')}
                className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
              >
                View grocery list →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">Pantry Check</h1>
              <p className="text-xs text-slate-500">
                {SECTION_LABELS[currentSection]}
                {' · '}
                {doneInSection} of {totalInSection.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkipSection}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip section
          </button>
        </div>

        {/* Section progress bar */}
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: totalInSection.length > 0
                ? `${(doneInSection / totalInSection.length) * 100}%`
                : '0%',
            }}
          />
        </div>
      </div>

      {/* ── Section tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-4 py-2">
        {sectionsWithItems.map((section, i) => {
          const total = checkItems.filter((c) => c.storageLocation === section).length;
          const done = checkItems.filter(
            (c) => c.storageLocation === section && c.status !== 'pending',
          ).length;
          const active = section === currentSection;
          return (
            <div
              key={section}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? 'bg-primary/20 text-primary'
                  : done === total
                    ? 'bg-green-500/10 text-green-500/70'
                    : 'text-slate-600'
              }`}
            >
              {SECTION_LABELS[section]}
              {done > 0 && <span className="ml-1 opacity-70">{done}/{total}</span>}
            </div>
          );
        })}
      </div>

      {/* ── Card or section-done state ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {sectionDone ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
            <div>
              <p className="text-lg font-bold text-white">
                {SECTION_LABELS[currentSection]} done!
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {doneInSection} item{doneInSection !== 1 ? 's' : ''} checked
              </p>
            </div>
            <button
              type="button"
              onClick={advance}
              className="mt-2 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              {currentSectionIndex < sectionsWithItems.length - 1 ? (
                <>Continue to next section →</>
              ) : (
                <>Finish</>
              )}
            </button>
          </div>
        ) : currentItem ? (
          <div className="w-full max-w-sm">
            <PantryCheckCard
              key={currentItem.groceryItemId}
              item={currentItem}
              onHave={() => markHave(currentItem.groceryItemId)}
              onNeed={() => markNeed(currentItem.groceryItemId)}
              onPartial={(amt) => markPartial(currentItem.groceryItemId, amt)}
            />
          </div>
        ) : (
          <p className="text-slate-600 text-sm">No items in this section.</p>
        )}
      </div>
    </div>
  );
}
