'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck, ChevronRight } from 'lucide-react';
import {
  useGroceryList,
  useToggleGroceryItem,
  useAddStandaloneItem,
  useDeleteGroceryItem,
} from '@/hooks/useGroceryList';
import { useHousehold } from '@/hooks/useHousehold';
import { weekStartISO } from '@/lib/utils';
import { GroceryList } from '@/components/grocery/GroceryList';
import { StandaloneItemForm } from '@/components/grocery/StandaloneItemForm';
import type { GroceryCategory, IngredientUnit } from '@/lib/supabase/types';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroceryPage() {
  const { data: membership, isLoading: householdLoading } = useHousehold();
  const { data: groceryData, isLoading: groceryLoading } = useGroceryList();

  const toggleItem = useToggleGroceryItem();
  const addItem = useAddStandaloneItem();
  const deleteItem = useDeleteGroceryItem();

  const [showForm, setShowForm] = useState(false);

  const isLoading = householdLoading || groceryLoading;
  const list = groceryData?.list ?? null;
  const items = groceryData?.items ?? [];
  const weekStart = list?.week_start_date ?? weekStartISO();

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const pantryChecked = !!list?.pantry_checked_at;

  async function handleAdd(item: {
    name: string;
    amount: number | null;
    unit: IngredientUnit | null;
    category: GroceryCategory;
  }) {
    if (!list) return;
    await addItem.mutateAsync({ listId: list.id, ...item });
    setShowForm(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded-xl bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-800" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // ── No household ─────────────────────────────────────────────────────────
  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
        <Link href="/household/create" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
          Create household
        </Link>
      </div>
    );
  }

  // ── No grocery list ──────────────────────────────────────────────────────
  if (!list) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <div className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-lg font-bold text-white">Grocery</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-5xl">🛒</span>
          <p className="font-medium text-white">No grocery list yet</p>
          <p className="text-sm text-slate-400">
            Finalize your meal plan to generate a grocery list.
          </p>
          <Link href="/plan" className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
            Go to meal plan →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">Grocery</h1>
            <p className="text-xs text-slate-500">
              Week of{' '}
              {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Pantry check CTA */}
          {!pantryChecked ? (
            <Link
              href="/grocery/pantry-check"
              className="flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Check pantry first
              <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400">
              ✓ Pantry checked
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{checkedCount} of {totalCount} items</span>
              {checkedCount === totalCount && (
                <span className="text-green-400">All done! 🎉</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0 px-4 pt-4">
        <GroceryList
          items={items}
          onToggle={(id, checked) => toggleItem.mutate({ itemId: id, checked })}
          onDelete={(id) => deleteItem.mutate(id)}
        />
      </div>

      {/* ── Standalone item form (bottom sheet) ─────────────────────────────── */}
      {showForm && (
        <StandaloneItemForm
          onAdd={handleAdd}
          onClose={() => setShowForm(false)}
          isSubmitting={addItem.isPending}
        />
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-transform"
        aria-label="Add item"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}
