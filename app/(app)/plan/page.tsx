'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useMealPlan, useAddSlot, useRemoveSlot, useMoveSlot, useFinalizeWeek } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import { weekStartISO } from '@/lib/utils';
import { WeekCalendar } from '@/components/plan/WeekCalendar';
import type { SlotRecipe } from '@/hooks/useMealPlan';
import type { MealType } from '@/lib/supabase/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: 'error' | 'info';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const router = useRouter();
  const { data: membership, isLoading: householdLoading } = useHousehold();
  const { data: planData, isLoading: planLoading } = useMealPlan();
  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();

  const addSlot = useAddSlot();
  const removeSlot = useRemoveSlot();
  const moveSlot = useMoveSlot();
  const finalizeWeek = useFinalizeWeek();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  // Build shortlist: all recipes formatted as SlotRecipe for dragging
  const shortlist: SlotRecipe[] = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    bg_color: r.bg_color,
    advance_prep_days: r.advance_prep_days,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddSlot = useCallback(
    ({
      recipeId,
      dayOfWeek,
      mealType,
      recipe,
    }: {
      recipeId: string;
      dayOfWeek: number;
      mealType: MealType;
      recipe: SlotRecipe;
    }) => {
      addSlot.mutate(
        { recipeId, dayOfWeek, mealType, recipe },
        {
          onError: () => showToast('Failed to add recipe to plan. Please try again.', 'error'),
        },
      );
    },
    [addSlot, showToast],
  );

  const handleMoveSlot = useCallback(
    ({ slotId, newDayOfWeek, newMealType }: { slotId: string; newDayOfWeek: number; newMealType: MealType }) => {
      moveSlot.mutate(
        { slotId, newDayOfWeek, newMealType },
        {
          onError: () => showToast('Failed to move recipe. Please try again.', 'error'),
        },
      );
    },
    [moveSlot, showToast],
  );

  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      removeSlot.mutate(slotId, {
        onError: () => showToast('Failed to remove recipe. Please try again.', 'error'),
      });
    },
    [removeSlot, showToast],
  );

  async function handleFinalize() {
    if (!planData?.plan) return;
    if (planData.slots.length === 0) {
      showToast('Add at least one meal before finalizing.', 'error');
      return;
    }
    setFinalizing(true);
    try {
      await finalizeWeek.mutateAsync(planData.plan.id);
      router.push('/grocery/pantry-check');
    } catch {
      showToast('Failed to generate grocery list. Please try again.', 'error');
    } finally {
      setFinalizing(false);
    }
  }

  const isLoading = householdLoading || planLoading || recipesLoading;
  const weekStart = planData?.weekStart ?? weekStartISO();
  const isFinalized = !!planData?.plan?.finalized_at;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded-xl bg-slate-800" />
          <div className="h-16 rounded-xl bg-slate-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // ── No household ──────────────────────────────────────────────────────────
  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
        <Link
          href="/household/create"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create household
        </Link>
      </div>
    );
  }

  // ── No recipes at all ─────────────────────────────────────────────────────
  if (recipes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <div className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-lg font-bold text-white">Meal Plan</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="font-medium text-white">No recipes to plan with</p>
          <p className="text-sm text-slate-400">Add some recipes first.</p>
          <Link
            href="/recipes/new"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Add a recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-white">Meal Plan</h1>
            <p className="text-xs text-slate-500">
              Week of{' '}
              {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {isFinalized ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finalized
            </span>
          ) : planData?.plan && planData.slots.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleFinalize()}
              disabled={finalizing}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {finalizing ? 'Generating…' : 'Generate grocery list →'}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`mx-4 mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
            toast.type === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Finalized banner ───────────────────────────────────────────────── */}
      {isFinalized && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
          <span className="text-green-300">Grocery list generated!</span>
          <Link href="/grocery" className="font-medium text-green-400 hover:text-green-300">
            View list →
          </Link>
        </div>
      )}

      {/* ── Empty plan hint (no slots yet) ────────────────────────────────── */}
      {planData && !planData.plan && !isFinalized && (
        <div className="mx-4 mt-3 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-400">
          Drag a recipe from the strip below onto any meal slot.
        </div>
      )}

      {/* ── Calendar + shortlist ──────────────────────────────────────────── */}
      {planData && (
        <div className="flex flex-col gap-4 px-4 pt-4">
          <WeekCalendar
            planData={planData}
            shortlist={shortlist}
            todayIndex={todayIndex()}
            onAddSlot={handleAddSlot}
            onMoveSlot={handleMoveSlot}
            onRemoveSlot={handleRemoveSlot}
            onToast={showToast}
          />
        </div>
      )}
    </div>
  );
}
