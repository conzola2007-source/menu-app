'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useGroceryList, useToggleGroceryItem } from '@/hooks/useGroceryList';
import { formatQuantity } from '@/lib/utils';
import type { GroceryListItem } from '@/hooks/useGroceryList';

// ─── Category order for store aisles ─────────────────────────────────────────

const CATEGORY_ORDER = [
  'produce',
  'dairy-eggs',
  'meat-seafood',
  'bakery',
  'frozen',
  'pantry',
  'snacks-drinks',
  'household',
  'other',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  produce: '🥦 Produce',
  'dairy-eggs': '🥛 Dairy & Eggs',
  'meat-seafood': '🥩 Meat & Seafood',
  frozen: '🧊 Frozen',
  pantry: '🥫 Pantry',
  'snacks-drinks': '🍫 Snacks & Drinks',
  bakery: '🍞 Bakery',
  household: '🧹 Household',
  other: '📦 Other',
};

// ─── Shopping item row ────────────────────────────────────────────────────────

function ShoppingItem({
  item,
  onToggle,
}: {
  item: GroceryListItem;
  onToggle: (id: string, checked: boolean) => void;
}) {
  function handleTap() {
    if ('vibrate' in navigator) navigator.vibrate(40);
    onToggle(item.id, !item.checked);
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors active:bg-slate-800/80 ${
        item.checked ? 'opacity-40' : ''
      }`}
    >
      {/* Large circle checkbox */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          item.checked
            ? 'border-primary bg-primary'
            : 'border-slate-500 bg-transparent'
        }`}
      >
        {item.checked && (
          <svg viewBox="0 0 12 10" className="h-4 w-4" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Name + quantity */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-base font-medium leading-snug ${
            item.checked ? 'text-slate-600 line-through' : 'text-white'
          }`}
        >
          {item.name}
        </p>
        {(item.amount !== null || item.unit) && (
          <p className="mt-0.5 text-sm text-slate-500">
            {item.amount !== null ? formatQuantity(item.amount) : ''}
            {item.unit ? ` ${item.unit}` : ''}
          </p>
        )}
      </div>

      {/* Cost */}
      {item.estimated_cost != null && (
        <span className="shrink-0 text-sm text-slate-600">
          £{item.estimated_cost.toFixed(2)}
        </span>
      )}
    </button>
  );
}

// ─── Done overlay ─────────────────────────────────────────────────────────────

function DoneOverlay({
  totalCost,
  totalItems,
  onFinish,
}: {
  totalCost: number | null;
  totalItems: number;
  onFinish: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 gap-6 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20">
        <CheckCircle2 className="h-14 w-14 text-green-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">All done!</h2>
        <p className="mt-1 text-slate-400">{totalItems} item{totalItems !== 1 ? 's' : ''} collected</p>
        {totalCost != null && (
          <p className="mt-2 text-lg font-semibold text-primary">
            Est. total: £{totalCost.toFixed(2)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onFinish}
        className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary/90 active:scale-95 transition-transform"
      >
        Back to list
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShoppingModePage() {
  const router = useRouter();
  const { data: groceryData, isLoading } = useGroceryList();
  const toggleItem = useToggleGroceryItem();
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [showDone, setShowDone] = useState(false);

  const items = groceryData?.items ?? [];
  const totalEstimatedCost = groceryData?.totalEstimatedCost ?? null;

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const allDone = totalCount > 0 && checkedCount === totalCount;

  // ── Wake Lock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let released = false;
    async function acquireWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        } catch {
          // Wake lock not supported or denied — degrade gracefully
        }
      }
    }
    void acquireWakeLock();

    return () => {
      released = true;
      if (wakeLockRef.current && !released) {
        void wakeLockRef.current.release();
      } else if (wakeLockRef.current) {
        void wakeLockRef.current.release();
      }
      wakeLockRef.current = null;
    };
  }, []);

  // ── Show done overlay when all checked ───────────────────────────────────
  useEffect(() => {
    if (allDone && !isLoading) {
      if ('vibrate' in navigator) navigator.vibrate([60, 40, 60]);
      setShowDone(true);
    }
  }, [allDone, isLoading]);

  function handleToggle(id: string, checked: boolean) {
    toggleItem.mutate({ itemId: id, checked });
  }

  // ── Group by category ──────────────────────────────────────────────────
  const categoryMap = new Map<string, GroceryListItem[]>();
  for (const cat of CATEGORY_ORDER) {
    const catItems = items.filter((i) => !i.checked && i.category === cat);
    if (catItems.length > 0) categoryMap.set(cat, catItems);
  }
  // Any category not in CATEGORY_ORDER
  for (const item of items.filter((i) => !i.checked)) {
    if (!CATEGORY_ORDER.includes(item.category as typeof CATEGORY_ORDER[number])) {
      const existing = categoryMap.get(item.category) ?? [];
      categoryMap.set(item.category, [...existing, item]);
    }
  }

  const checkedItems = items.filter((i) => i.checked);
  const costCollected = checkedItems.reduce((sum, i) => sum + (i.estimated_cost ?? 0), 0);
  const hasCost = checkedItems.some((i) => i.estimated_cost != null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      {/* Done overlay */}
      {showDone && (
        <DoneOverlay
          totalCost={totalEstimatedCost}
          totalItems={totalCount}
          onFinish={() => router.push('/grocery')}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/grocery')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Exit shopping mode"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <h1 className="text-base font-bold text-white">Shopping</h1>
            </div>
            <p className="text-xs text-slate-500">
              {checkedCount} of {totalCount} collected
              {hasCost && checkedCount > 0 && (
                <> · £{costCollected.toFixed(2)} in basket</>
              )}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Category groups ───────────────────────────────────────────────── */}
      {categoryMap.size === 0 && checkedCount > 0 ? null : (
        <div className="divide-y divide-slate-800/60">
          {[...categoryMap.entries()].map(([category, catItems]) => (
            <div key={category}>
              <div className="bg-slate-800/40 px-5 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {CATEGORY_LABELS[category] ?? category}
                </p>
              </div>
              <div className="divide-y divide-slate-800/40">
                {catItems.map((item) => (
                  <ShoppingItem key={item.id} item={item} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Checked (in basket) ───────────────────────────────────────────── */}
      {checkedItems.length > 0 && (
        <div className="mt-4">
          <div className="px-5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              In basket ({checkedItems.length})
            </p>
          </div>
          <div className="divide-y divide-slate-800/30">
            {checkedItems.map((item) => (
              <ShoppingItem key={item.id} item={item} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="text-5xl">🛒</span>
          <p className="font-medium text-white">No items on your list</p>
          <button
            type="button"
            onClick={() => router.push('/grocery')}
            className="text-sm text-primary hover:underline"
          >
            Back to grocery
          </button>
        </div>
      )}
    </div>
  );
}
