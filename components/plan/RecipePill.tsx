'use client';

import { AlertTriangle } from 'lucide-react';
import type { SlotRecipe } from '@/hooks/useMealPlan';
import { prepStartDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipePillProps {
  recipe: SlotRecipe;
  /** When set, show "Start prep: [day]" label (recipe is in the calendar) */
  dayOfWeek?: number;
  /** Required alongside dayOfWeek for prep-date calculation */
  weekStart?: string;
  /** Visual variant */
  compact?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatPrepDate(dayOfWeek: number, weekStart: string, advancePrepDays: number): string {
  const eatDate = new Date(weekStart + 'T00:00:00');
  eatDate.setDate(eatDate.getDate() + dayOfWeek);
  const prep = prepStartDate(eatDate, advancePrepDays);
  const prepDay = (prep.getDay() + 6) % 7; // 0=Mon
  return `Start prep ${SHORT_DAYS[prepDay]} ${prep.getDate()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecipePill({
  recipe,
  dayOfWeek,
  weekStart,
  compact = false,
  className = '',
}: RecipePillProps) {
  const showPrep =
    recipe.advance_prep_days > 0 &&
    dayOfWeek !== undefined &&
    weekStart !== undefined;

  if (compact) {
    // Small chip for shortlist
    return (
      <div
        className={`flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 ${className}`}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: recipe.bg_color }}
        >
          {recipe.emoji}
        </div>
        <span className="max-w-[96px] truncate text-sm font-medium text-white">
          {recipe.title}
        </span>
        {recipe.advance_prep_days > 0 && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        )}
      </div>
    );
  }

  // Full pill for calendar slots
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-2 ${className}`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
        style={{ backgroundColor: recipe.bg_color }}
      >
        {recipe.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{recipe.title}</p>
        {showPrep && weekStart !== undefined && (
          <p className="flex items-center gap-1 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            {formatPrepDate(dayOfWeek!, weekStart, recipe.advance_prep_days)}
          </p>
        )}
      </div>
    </div>
  );
}
