'use client';

import Link from 'next/link';
import { ArrowRight, ChefHat, Vote, Calendar, AlertTriangle } from 'lucide-react';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { dayName, weekStartISO } from '@/lib/utils';
import type { MealType } from '@/lib/supabase/types';
import type { MealPlanSlot, VoteStatus } from '@/hooks/useMealPlan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 0 = Monday, 6 = Sunday */
function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function mealLabel(meal: MealType): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

// ─── Plan status banner (PRD §12.6) ──────────────────────────────────────────

interface BannerProps {
  plan: { id: string; finalized_at: string | null } | null;
  slots: MealPlanSlot[];
  voteStatus: VoteStatus;
}

function PlanStatusBanner({ plan, slots, voteStatus }: BannerProps) {
  const { totalMembers, votedNames, waitingOnNames } = voteStatus;
  const hasSlots = slots.length > 0;

  if (plan?.finalized_at) return null;

  if (hasSlots) {
    return (
      <Link
        href="/plan"
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm"
      >
        <Calendar className="h-4 w-4 shrink-0 text-primary" />
        <span className="flex-1 text-primary">Meal plan in progress</span>
        <ArrowRight className="h-4 w-4 text-primary" />
      </Link>
    );
  }

  if (votedNames.length >= totalMembers && totalMembers > 0) {
    return (
      <Link
        href="/plan"
        className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm"
      >
        <Vote className="h-4 w-4 shrink-0 text-green-400" />
        <span className="flex-1 text-green-300">Voting done! Allocate meals →</span>
        <ArrowRight className="h-4 w-4 text-green-400" />
      </Link>
    );
  }

  if (votedNames.length > 0) {
    const waiting =
      waitingOnNames.slice(0, 2).join(', ') +
      (waitingOnNames.length > 2 ? ` +${waitingOnNames.length - 2} more` : '');
    return (
      <div className="flex items-start gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm">
        <Vote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <div>
          <span className="text-slate-300">
            {votedNames.length} of {totalMembers} members voted.
          </span>
          {waitingOnNames.length > 0 && (
            <p className="mt-0.5 text-xs text-slate-500">Waiting on {waiting}…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/vote"
      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm hover:border-slate-500"
    >
      <ChefHat className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="flex-1 text-slate-300">No meals planned yet.</span>
      <span className="text-primary">Start voting →</span>
    </Link>
  );
}

// ─── Slot tile ────────────────────────────────────────────────────────────────

function SlotTile({ slot }: { slot: MealPlanSlot }) {
  return (
    <Link
      href={`/recipes/${slot.recipe.id}`}
      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 transition-all hover:border-slate-500 active:scale-[0.98]"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
        style={{ backgroundColor: slot.recipe.bg_color }}
      >
        {slot.recipe.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{slot.recipe.title}</p>
        {slot.recipe.advance_prep_days > 0 && (
          <p className="flex items-center gap-1 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {slot.recipe.advance_prep_days}d prep needed
          </p>
        )}
      </div>
      <span className="shrink-0 text-xs text-slate-600">{mealLabel(slot.meal_type)}</span>
    </Link>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────

function DayCard({
  dayIndex,
  isToday,
  slots,
}: {
  dayIndex: number;
  isToday: boolean;
  slots: Partial<Record<MealType, MealPlanSlot>>;
}) {
  const filledSlots = MEAL_ORDER.filter((m) => slots[m]);
  const hasAny = filledSlots.length > 0;

  return (
    <div
      className={`rounded-2xl border p-3 ${
        isToday ? 'border-primary/40 bg-primary/5' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-slate-300'}`}>
          {dayName(dayIndex)}
        </h3>
        {isToday && (
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
            Today
          </span>
        )}
        {!hasAny && (
          <Link href="/plan" className="ml-auto text-xs text-slate-600 hover:text-slate-400">
            + Add meal
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {MEAL_ORDER.map((meal) => {
          const slot = slots[meal];
          return slot ? <SlotTile key={meal} slot={slot} /> : null;
        })}
        {!hasAny && (
          <p className="py-1 text-xs text-slate-700 italic">Nothing planned</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeekPage() {
  const { data: membership } = useHousehold();
  useAuthStore((s) => s.user);
  const { data, isLoading, error } = useMealPlan();

  const today = todayIndex();
  const weekStart = weekStartISO();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-xl bg-slate-800" />
          {Array.from({ length: 4 }).map((_, i) => (
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
        <p className="font-medium text-white">You're not in a household yet</p>
        <p className="text-sm text-slate-400">
          Join or create a household to start planning meals.
        </p>
        <Link
          href="/household/create"
          className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create household
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
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
          <Link
            href="/household/settings"
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        {/* Status banner */}
        {data && (
          <PlanStatusBanner
            plan={data.plan}
            slots={data.slots}
            voteStatus={data.voteStatus}
          />
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-400">
            Failed to load meal plan. Try refreshing.
          </div>
        )}

        {data && (
          <>
            {/* Today first (highlighted) */}
            <DayCard dayIndex={today} isToday={true} slots={data.slotsByDay[today] ?? {}} />

            {/* Remaining days in week order */}
            {[0, 1, 2, 3, 4, 5, 6]
              .filter((i) => i !== today)
              .map((dayIndex) => (
                <DayCard
                  key={dayIndex}
                  dayIndex={dayIndex}
                  isToday={false}
                  slots={data.slotsByDay[dayIndex] ?? {}}
                />
              ))}
          </>
        )}

        {/* Quick actions */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { href: '/vote', icon: Vote, label: 'Vote' },
            { href: '/plan', icon: Calendar, label: 'Plan' },
            { href: '/recipes', icon: ChefHat, label: 'Recipes' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 p-3 hover:border-slate-500"
            >
              <Icon className="h-5 w-5 text-slate-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
