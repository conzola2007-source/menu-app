'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, X, ChevronLeft, CalendarDays } from 'lucide-react';
import { useMealPlan, useAddSlot, useRemoveSlot, useFinalizeWeek, useUpdatePlanDuration } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import { weekStartISO } from '@/lib/utils';
import { DayCountPicker } from '@/components/plan/DayCountPicker';
import { CalendarGrid } from '@/components/plan/CalendarGrid';
import type { SlotRecipe } from '@/hooks/useMealPlan';

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
  const finalizeWeek = useFinalizeWeek();
  const updateDuration = useUpdatePlanDuration();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  // Local duration state — syncs from plan data once loaded
  const [durationDays, setDurationDays] = useState(7);
  const [durationConfirmed, setDurationConfirmed] = useState(false);

  // Sync duration from loaded plan
  useEffect(() => {
    if (planData?.plan?.duration_days) {
      setDurationDays(planData.plan.duration_days);
      setDurationConfirmed(true);
    }
  }, [planData?.plan?.duration_days]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  // Build recipe shortlist
  const shortlist: SlotRecipe[] = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    bg_color: r.bg_color,
    advance_prep_days: r.advance_prep_days,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddSlot = useCallback(
    (slotDate: string, recipeId: string) => {
      const recipe = shortlist.find((r) => r.id === recipeId);
      if (!recipe) return;
      addSlot.mutate(
        { recipeId, slotDate, recipe },
        { onError: () => showToast('Failed to add recipe. Please try again.', 'error') },
      );
    },
    [addSlot, shortlist, showToast],
  );

  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      removeSlot.mutate(slotId, {
        onError: () => showToast('Failed to remove recipe. Please try again.', 'error'),
      });
    },
    [removeSlot, showToast],
  );

  function handleDurationConfirm() {
    setDurationConfirmed(true);
    updateDuration.mutate(
      { durationDays },
      { onError: () => showToast('Failed to save duration.', 'error') },
    );
  }

  async function handleFinalize() {
    if (!planData?.plan) return;
    if (planData.slots.length === 0) {
      showToast('Add at least one meal before generating the grocery list.', 'error');
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
  const startDate = planData?.plan?.start_date ?? weekStart;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded-xl bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-800" />
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
        <Link href="/household/create" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
          Create household
        </Link>
      </div>
    );
  }

  // ── No recipes at all ─────────────────────────────────────────────────────
  if (recipes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <header className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-lg font-bold text-white">Meal Plan</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="font-medium text-white">No recipes to plan with</p>
          <Link href="/recipes/new" className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
            Add a recipe
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 1: Pick duration (if no plan yet and not confirmed) ──────────────
  if (!durationConfirmed) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-white">Allocate meals</h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-12">
          <div className="text-center">
            <div className="mb-2 text-4xl">📅</div>
            <h2 className="text-lg font-bold text-white">How many days?</h2>
            <p className="mt-1 text-sm text-slate-400">Choose how many dinners to plan for</p>
          </div>

          <DayCountPicker value={durationDays} onChange={setDurationDays} />

          <button
            type="button"
            onClick={handleDurationConfirm}
            className="w-full max-w-xs rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Set up {durationDays}-day plan →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Calendar grid ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDurationConfirmed(false)} className="text-slate-400 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">Meal Plan</h1>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3 w-3" />
                {durationDays} days starting{' '}
                {new Date(startDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {isFinalized ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finalized
            </span>
          ) : planData?.slots && planData.slots.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleFinalize()}
              disabled={finalizing}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {finalizing ? 'Generating…' : 'Grocery list →'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mx-4 mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
            toast.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Finalized banner */}
      {isFinalized && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
          <span className="text-green-300">Grocery list generated!</span>
          <Link href="/grocery" className="font-medium text-green-400 hover:text-green-300">
            View list →
          </Link>
        </div>
      )}

      {/* Calendar grid */}
      <div className="px-4 pt-4">
        <CalendarGrid
          startDate={startDate}
          durationDays={durationDays}
          slots={planData?.slots ?? []}
          isFinalized={isFinalized}
          recipes={shortlist}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
        />
      </div>
    </div>
  );
}
