'use client';

import Link from 'next/link';
import { ArrowRight, ChefHat, CalendarDays, ShoppingCart, CheckCircle2, Clock } from 'lucide-react';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useVoteData } from '@/hooks/useVotes';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { weekStartISO } from '@/lib/utils';
import type { MealPlanSlot } from '@/hooks/useMealPlan';
import type { VoteType } from '@/lib/supabase/types';
import type { VoteRecipe } from '@/hooks/useVotes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayISO(): string {
  return toLocalISODate(new Date());
}

// ─── Vote tally helpers ───────────────────────────────────────────────────────

function computeTallies(
  recipes: VoteRecipe[],
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[]
): { recipe: VoteRecipe; yes: number; super: number; total: number }[] {
  return recipes
    .map((r) => {
      const rv = allVotes.filter((v) => v.recipe_id === r.id);
      const yes = rv.filter((v) => v.vote === 'yes').length;
      const sup = rv.filter((v) => v.vote === 'super').length;
      return { recipe: r, yes, super: sup, total: yes + sup * 2 };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);
}

// ─── Slot tile ────────────────────────────────────────────────────────────────

function SlotTile({ slot }: { slot: MealPlanSlot }) {
  return (
    <Link
      href={`/recipes/${slot.recipe.id}`}
      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 hover:border-slate-500"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
        style={{ backgroundColor: slot.recipe.bg_color }}
      >
        {slot.recipe.emoji}
      </div>
      <p className="flex-1 truncate text-sm font-medium text-white">{slot.recipe.title}</p>
    </Link>
  );
}

// ─── State 1: No votes yet ────────────────────────────────────────────────────

function StateNoVotes({ recipeCount }: { recipeCount: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-900 py-10 text-center">
        <ChefHat className="h-10 w-10 text-slate-600" />
        <div>
          <p className="font-semibold text-white">No meal plan yet</p>
          <p className="mt-1 text-sm text-slate-400">
            {recipeCount > 0
              ? `${recipeCount} recipe${recipeCount !== 1 ? 's' : ''} available to vote on`
              : 'Add some recipes first, then start voting'}
          </p>
        </div>
        <Link
          href="/vote"
          className="mt-2 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          Start voting
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/recipes/new"
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center hover:border-slate-600"
        >
          <ChefHat className="h-6 w-6 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Add recipe</span>
        </Link>
        <Link
          href="/recipes"
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center hover:border-slate-600"
        >
          <CalendarDays className="h-6 w-6 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">Browse recipes</span>
        </Link>
      </div>
    </div>
  );
}

// ─── State 2: Voting in progress ──────────────────────────────────────────────

function StateVoting({
  memberStatuses,
  iDoneVoting,
}: {
  memberStatuses: { user_id: string; display_name: string; hasFinished: boolean; votedCount: number }[];
  iDoneVoting: boolean;
}) {
  const doneCount = memberStatuses.filter((m) => m.hasFinished).length;
  const total = memberStatuses.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Voting in progress</p>
          <span className="text-sm text-slate-400">{doneCount}/{total} done</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>

        {/* Member list */}
        <ul className="mt-4 space-y-2">
          {memberStatuses.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2">
              {m.hasFinished ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
              ) : (
                <Clock className="h-4 w-4 shrink-0 text-slate-600" />
              )}
              <span className={`flex-1 text-sm ${m.hasFinished ? 'text-white' : 'text-slate-400'}`}>
                {m.display_name}
              </span>
              {m.hasFinished ? (
                <span className="text-xs text-green-400">Voted</span>
              ) : (
                <span className="text-xs text-slate-600">{m.votedCount} so far</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      {!iDoneVoting ? (
        <Link
          href="/vote"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          Continue voting
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-center text-sm text-green-400">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5" />
          You&apos;re done! Waiting for others…
        </div>
      )}
    </div>
  );
}

// ─── State 3: All voted — show results ───────────────────────────────────────

function StateAllVoted({
  tallies,
}: {
  tallies: { recipe: VoteRecipe; yes: number; super: number; total: number }[];
}) {
  const topTallies = tallies.slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
        <p className="font-semibold text-green-300">Everyone has voted!</p>
        <p className="mt-0.5 text-xs text-green-500">Ready to allocate meals to the week</p>
      </div>

      {/* Vote results */}
      {topTallies.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top picks
          </p>
          {topTallies.map((t, i) => (
            <div
              key={t.recipe.id}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
            >
              <span className="w-5 text-center text-xs font-bold text-slate-500">
                {i + 1}
              </span>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: t.recipe.bg_color }}
              >
                {t.recipe.emoji}
              </div>
              <span className="flex-1 truncate text-sm font-medium text-white">
                {t.recipe.title}
              </span>
              <div className="flex items-center gap-1.5">
                {t.super > 0 && (
                  <span className="text-xs text-amber-400">⭐×{t.super}</span>
                )}
                {t.yes > 0 && (
                  <span className="text-xs text-green-400">✓×{t.yes}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/plan"
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
      >
        <CalendarDays className="h-4 w-4" />
        Allocate meals to days
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ─── State 4/5: Has meal plan ─────────────────────────────────────────────────

function StateMealPlan({
  slots,
  finalized,
}: {
  slots: MealPlanSlot[];
  finalized: boolean;
}) {
  const today = todayISO();

  // Sort slots by date; put today first
  const sortedSlots = [...slots].sort((a, b) => {
    if (a.slot_date === today) return -1;
    if (b.slot_date === today) return 1;
    return a.slot_date.localeCompare(b.slot_date);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header action */}
      {finalized ? (
        <Link
          href="/grocery"
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          <ShoppingCart className="h-4 w-4" />
          View grocery list
          <ArrowRight className="ml-auto h-4 w-4" />
        </Link>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/plan"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-500"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Edit plan
          </Link>
          <Link
            href="/grocery"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-medium text-white"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Grocery list
          </Link>
        </div>
      )}

      {/* Day-by-day view */}
      <div className="flex flex-col gap-3">
        {sortedSlots.map((slot) => {
          const isToday = slot.slot_date === today;
          const date = new Date(slot.slot_date + 'T00:00:00');
          const dayName = DAY_NAMES_SHORT[date.getDay()];
          const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border p-3 ${
                isToday ? 'border-primary/30 bg-primary/5' : 'border-slate-800 bg-slate-900'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-slate-300'}`}>
                  {dayName}
                </span>
                <span className={`text-xs ${isToday ? 'text-primary/70' : 'text-slate-600'}`}>{dateLabel}</span>
                {isToday && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">Today</span>
                )}
              </div>
              <SlotTile slot={slot} />
            </div>
          );
        })}

        {slots.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <p className="text-sm text-slate-500">
              No meals allocated yet.{' '}
              <Link href="/plan" className="text-primary hover:underline">
                Add some →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PlannedPage() {
  const { data: membership } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const { data: planData, isLoading: planLoading } = useMealPlan();
  const { data: voteData, isLoading: voteLoading } = useVoteData();

  const weekStart = weekStartISO();
  const isLoading = planLoading || voteLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-xl bg-slate-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
        <p className="text-sm text-slate-400">Join or create a household to start planning meals.</p>
        <Link
          href="/household/create"
          className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create household
        </Link>
      </div>
    );
  }

  // ── Determine workflow state ──
  const hasSlots = (planData?.slots.length ?? 0) > 0;
  const isFinalized = !!planData?.plan?.finalized_at;
  const memberStatuses = voteData?.memberStatuses ?? [];
  const anyVoted = memberStatuses.some((m) => m.votedCount > 0);
  const allVoted = (voteData?.allMembersFinished ?? false) && memberStatuses.length > 0;
  const iDoneVoting = memberStatuses.find((m) => m.user_id === user?.id)?.hasFinished ?? false;

  const tallies = voteData
    ? computeTallies(voteData.recipes, voteData.allVotes)
    : [];

  // Determine which state to render
  type PlanState = 'no-votes' | 'voting' | 'all-voted' | 'has-plan';
  let state: PlanState = 'no-votes';
  if (hasSlots || isFinalized) state = 'has-plan';
  else if (allVoted) state = 'all-voted';
  else if (anyVoted) state = 'voting';

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{membership.household.name}</h1>
            <p className="text-xs text-slate-500">
              Week of{' '}
              {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          {state === 'has-plan' && (
            <Link
              href="/vote?mode=revote"
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Re-vote
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {state === 'no-votes' && (
          <StateNoVotes recipeCount={voteData?.recipes.length ?? 0} />
        )}
        {state === 'voting' && (
          <StateVoting memberStatuses={memberStatuses} iDoneVoting={iDoneVoting} />
        )}
        {state === 'all-voted' && (
          <StateAllVoted tallies={tallies} />
        )}
        {state === 'has-plan' && planData && (
          <StateMealPlan
            slots={planData.slots}
            finalized={isFinalized}
          />
        )}
      </div>
    </div>
  );
}
