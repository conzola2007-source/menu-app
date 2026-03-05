'use client';

import { useMemo } from 'react';
import { DayCell } from './DayCell';
import type { MealPlanSlot } from '@/hooks/useMealPlan';

interface CalendarGridProps {
  startDate: string;    // YYYY-MM-DD
  durationDays: number;
  slots: MealPlanSlot[];
  isFinalized: boolean;
  recipes: Array<{ id: string; title: string; emoji: string; bg_color: string; advance_prep_days: number }>;
  onAddSlot: (slotDate: string, recipeId: string) => void;
  onRemoveSlot: (slotId: string) => void;
}

export function CalendarGrid({
  startDate,
  durationDays,
  slots,
  isFinalized,
  recipes,
  onAddSlot,
  onRemoveSlot,
}: CalendarGridProps) {
  const todayISO = toLocalISODate(new Date());

  // Build a map from slot_date → slot for O(1) lookup
  const slotByDate = useMemo(() => {
    const map: Record<string, MealPlanSlot> = {};
    for (const s of slots) map[s.slot_date] = s;
    return map;
  }, [slots]);

  // Generate the array of Date objects for the grid
  const days = useMemo(() => {
    const result: Date[] = [];
    // Parse start date as local time (avoid UTC offset issues)
    const [y, m, d] = startDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    for (let i = 0; i < durationDays; i++) {
      const day = new Date(base);
      day.setDate(base.getDate() + i);
      result.push(day);
    }
    return result;
  }, [startDate, durationDays]);

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
    >
      {days.map((date) => {
        const iso = toLocalISODate(date);
        return (
          <DayCell
            key={iso}
            date={date}
            slot={slotByDate[iso] ?? null}
            isToday={iso === todayISO}
            isFinalized={isFinalized}
            recipes={recipes}
            onAdd={onAddSlot}
            onRemove={onRemoveSlot}
          />
        );
      })}
    </div>
  );
}

/** Format a Date as YYYY-MM-DD in local time */
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
