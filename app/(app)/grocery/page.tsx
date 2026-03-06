'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck, ChevronRight, Scissors, Users, ShoppingCart } from 'lucide-react';
import {
  useGroceryList,
  useToggleGroceryItem,
  useAddStandaloneItem,
  useDeleteGroceryItem,
} from '@/hooks/useGroceryList';
import { useHousehold } from '@/hooks/useHousehold';
import { useShoppingAttendance, useMarkComingShopping, useUnmarkComingShopping } from '@/hooks/useShoppingAttendance';
import { useAuthStore } from '@/stores/authStore';
import { weekStartISO } from '@/lib/utils';
import { GroceryList } from '@/components/grocery/GroceryList';
import { StandaloneItemForm } from '@/components/grocery/StandaloneItemForm';
import { SplitShoppingSheet } from '@/components/grocery/SplitShoppingSheet';
import type { GroceryCategory, IngredientUnit } from '@/lib/supabase/types';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroceryPage() {
  const { data: membership, isLoading: householdLoading } = useHousehold();
  const { data: groceryData, isLoading: groceryLoading } = useGroceryList();
  const user = useAuthStore((s) => s.user);

  const list = groceryData?.list ?? null;
  const { data: attendance = [] } = useShoppingAttendance(list?.id ?? null);
  const markComing = useMarkComingShopping();
  const unmarkComing = useUnmarkComingShopping();

  const toggleItem = useToggleGroceryItem();
  const addItem = useAddStandaloneItem();
  const deleteItem = useDeleteGroceryItem();

  const [showForm, setShowForm] = useState(false);
  const [showSplitSheet, setShowSplitSheet] = useState(false);
  const [myListOnly, setMyListOnly] = useState(false);

  const isLoading = householdLoading || groceryLoading;
  const items = groceryData?.items ?? [];
  const totalEstimatedCost = groceryData?.totalEstimatedCost ?? null;
  const weekStart = list?.week_start_date ?? weekStartISO();
  const members = membership?.members ?? [];

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const pantryChecked = !!list?.pantry_checked_at;

  const currentUserId = user?.id ?? null;
  const iAmComing = attendance.some((a) => a.user_id === currentUserId);

  // Filter items for "My list" mode
  const displayedItems = myListOnly
    ? items.filter((i) => i.assigned_to === currentUserId)
    : items;

  function toggleMyAttendance() {
    if (!list) return;
    if (iAmComing) {
      unmarkComing.mutate(list.id);
    } else {
      markComing.mutate(list.id);
    }
  }

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
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
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

          <div className="flex items-center gap-2">
            {/* My list toggle */}
            <button
              type="button"
              onClick={() => setMyListOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                myListOnly
                  ? 'bg-primary text-white'
                  : 'border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
            >
              My list
            </button>

            {/* Split button */}
            <button
              type="button"
              onClick={() => setShowSplitSheet(true)}
              className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-500 hover:text-white"
            >
              <Scissors className="h-3.5 w-3.5" />
              Split
            </button>

            {/* Pantry check CTA */}
            {!pantryChecked ? (
              <Link
                href="/grocery/pantry-check"
                className="flex items-center gap-1.5 rounded-full border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Pantry
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-400">
                ✓ Pantry
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{checkedCount} of {totalCount} items</span>
              <span>
                {checkedCount === totalCount && (
                  <span className="text-green-400">All done! 🎉</span>
                )}
                {totalEstimatedCost != null && checkedCount !== totalCount && (
                  <span className="text-slate-500">Est. <span className="font-medium text-slate-400">£{totalEstimatedCost.toFixed(2)}</span></span>
                )}
              </span>
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

      {/* ── Going shopping row ───────────────────────────────────────────────── */}
      {members.length > 0 && (
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-2.5">
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-600" />
          <span className="text-xs text-slate-500 shrink-0">Going shopping:</span>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {members.map((m) => {
              const isComing = attendance.some((a) => a.user_id === m.user_id);
              const isMe = m.user_id === currentUserId;
              const initials = m.profile.display_name.slice(0, 2).toUpperCase();
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={isMe ? toggleMyAttendance : undefined}
                  disabled={!isMe}
                  title={m.profile.display_name}
                  className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-xs font-semibold transition-all ${
                    isComing
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-500'
                  } ${isMe ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                >
                  {initials}
                </button>
              );
            })}
          </div>
          {!iAmComing && (
            <button
              type="button"
              onClick={toggleMyAttendance}
              className="shrink-0 text-xs text-primary hover:underline"
            >
              I&apos;m going
            </button>
          )}
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0 px-4 pt-4">
        {myListOnly && displayedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-sm text-slate-400">No items assigned to you yet.</p>
            <button
              type="button"
              onClick={() => setShowSplitSheet(true)}
              className="text-sm text-primary hover:underline"
            >
              Open split sheet →
            </button>
          </div>
        ) : (
          <GroceryList
            items={displayedItems}
            onToggle={(id, checked) => toggleItem.mutate({ itemId: id, checked })}
            onDelete={(id) => deleteItem.mutate(id)}
          />
        )}
      </div>

      {/* ── Standalone item form (bottom sheet) ─────────────────────────────── */}
      <StandaloneItemForm
        isOpen={showForm}
        onAdd={handleAdd}
        onClose={() => setShowForm(false)}
        isSubmitting={addItem.isPending}
      />

      {/* ── Split shopping sheet ─────────────────────────────────────────────── */}
      <SplitShoppingSheet
        isOpen={showSplitSheet}
        onClose={() => setShowSplitSheet(false)}
        items={items}
        members={members}
      />

      {/* ── Start shopping button ─────────────────────────────────────────── */}
      {totalCount > 0 && (
        <Link
          href="/grocery/shopping"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/40 hover:bg-green-500 active:scale-95 transition-transform"
        >
          <ShoppingCart className="h-4 w-4" />
          Start shopping
        </Link>
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
