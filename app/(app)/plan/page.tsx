'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronLeft, CalendarDays, ShoppingCart } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useMealPlan, useAddSlot, useRemoveSlot, useFinalizeWeek, useUpdatePlanDuration } from '@/hooks/useMealPlan';
import { useHouseholdPool } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import { useVoteData } from '@/hooks/useVotes';
import { isHead } from '@/lib/roles';
import { DayCountPicker } from '@/components/plan/DayCountPicker';
import { CalendarGrid } from '@/components/plan/CalendarGrid';
import type { SlotRecipe } from '@/hooks/useMealPlan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const router = useRouter();
  const { data: membership, isLoading: householdLoading } = useHousehold();
  const { data: planData, isLoading: planLoading } = useMealPlan();
  const householdId = membership?.household?.id ?? null;
  const { data: recipes = [], isLoading: recipesLoading } = useHouseholdPool(householdId);
  const { data: voteData } = useVoteData();
  const currentUserIsHead = membership ? isHead(membership.role) : false;
  const members = membership?.members ?? [];

  const addSlot = useAddSlot();
  const removeSlot = useRemoveSlot();
  const finalizeWeek = useFinalizeWeek();
  const updateDuration = useUpdatePlanDuration();

  const [toast, setToast] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [durationDays, setDurationDays] = useState(7);
  const [durationConfirmed, setDurationConfirmed] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  // Pending duration while picker sheet is open
  const [pendingDuration, setPendingDuration] = useState(7);

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

  // Build recipe shortlist
  const shortlist: SlotRecipe[] = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    emoji: r.emoji,
    bg_color: r.bg_color,
    advance_prep_days: r.advance_prep_days,
    servings: r.servings ?? 1,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddSlot = useCallback(
    (slotDate: string, recipeId: string) => {
      const recipe = shortlist.find((r) => r.id === recipeId);
      if (!recipe) return;
      addSlot.mutate(
        { recipeId, slotDate, recipe },
        { onError: () => setToast('Failed to add recipe. Please try again.') },
      );
    },
    [addSlot, shortlist],
  );

  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      removeSlot.mutate(slotId, {
        onError: () => setToast('Failed to remove recipe. Please try again.'),
      });
    },
    [removeSlot],
  );

  function handleDurationConfirm() {
    setDurationConfirmed(true);
    updateDuration.mutate(
      { durationDays },
      { onError: () => setToast('Failed to save duration.') },
    );
  }

  function handleDayPickerConfirm() {
    setDurationDays(pendingDuration);
    setShowDayPicker(false);
    updateDuration.mutate(
      { durationDays: pendingDuration },
      { onError: () => setToast('Failed to save duration.') },
    );
  }

  async function handleFinalize() {
    if (!planData?.plan) return;
    if ((planData.slots?.length ?? 0) === 0) {
      setToast('Add at least one meal before generating the grocery list.');
      return;
    }
    setFinalizing(true);
    try {
      await finalizeWeek.mutateAsync(planData.plan.id);
      router.push('/grocery/pantry-check');
    } catch {
      setToast('Failed to generate grocery list. Please try again.');
    } finally {
      setFinalizing(false);
    }
  }

  const isLoading = householdLoading || planLoading || recipesLoading;
  // Always start from today — never show past days
  const startDate = toLocalISODate(new Date());
  const hasSlots = (planData?.slots?.length ?? 0) > 0;

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

  // ── No recipes ────────────────────────────────────────────────────────────
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

  // ── Step 1: Pick duration (first visit, no plan yet) ──────────────────────
  if (!durationConfirmed) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <button type="button" onClick={() => router.replace('/vote')} className="text-slate-400 hover:text-white">
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
    <div className="min-h-screen bg-slate-900 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.replace('/vote')} className="text-slate-400 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-white">Meal Plan</h1>
          </div>

          {/* Day count button — always visible, opens picker sheet */}
          <button
            type="button"
            onClick={() => {
              setPendingDuration(durationDays);
              setShowDayPicker(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {durationDays}d
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <span className="flex-1">{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="px-4 pt-4">
        <CalendarGrid
          startDate={startDate}
          durationDays={durationDays}
          slots={planData?.slots ?? []}
          recipes={shortlist}
          allVotes={voteData?.allVotes ?? []}
          totalMembers={voteData?.totalMembers ?? 0}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
          householdId={householdId}
          isHead={currentUserIsHead}
          members={members}
        />
      </div>

      {/* Sticky grocery list CTA — only when slots exist */}
      {hasSlots && (
        <div className="fixed bottom-16 left-0 right-0 z-10 px-4 pb-2">
          <button
            type="button"
            onClick={() => void handleFinalize()}
            disabled={finalizing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" />
            {finalizing ? 'Generating…' : 'Generate grocery list →'}
          </button>
        </div>
      )}

      {/* Day count picker sheet */}
      <Sheet
        isOpen={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        title="How many days?"
      >
        <div className="flex flex-col items-center gap-6 px-4 py-6">
          <DayCountPicker value={pendingDuration} onChange={setPendingDuration} />
          <button
            type="button"
            onClick={handleDayPickerConfirm}
            className="w-full max-w-xs rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Use {pendingDuration}-day plan
          </button>
        </div>
      </Sheet>
    </div>
  );
}
