'use client';

import { X } from 'lucide-react';
import type { MealPlanSlot } from '@/hooks/useMealPlan';

interface DayCellProps {
  date: Date;
  slot: MealPlanSlot | null;
  isToday: boolean;
  recipes: Array<{ id: string; title: string; emoji: string; bg_color: string; advance_prep_days: number }>;
  onAdd: (slotDate: string, recipeId: string) => void;
  onRemove: (slotId: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DayCell({
  date,
  slot,
  isToday,
  recipes,
  onAdd,
  onRemove,
}: DayCellProps) {
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const slotDateISO = toLocalISODate(date);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-slate-900 overflow-hidden ${
        isToday ? 'border-primary/60' : 'border-slate-800'
      }`}
    >
      {/* Day header */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          isToday ? 'bg-primary/10' : 'bg-slate-800/50'
        }`}
      >
        <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-slate-400'}`}>
          {dayName}
        </span>
        <span className={`text-xs ${isToday ? 'text-primary' : 'text-slate-500'}`}>
          {dayNum} {month}
        </span>
      </div>

      {/* Slot content */}
      <div className="flex min-h-[72px] flex-1 items-center justify-center p-2">
        {slot ? (
          <div
            className="relative flex w-full items-center gap-2 rounded-xl px-2.5 py-2"
            style={{ backgroundColor: slot.recipe.bg_color + '33' }}
          >
            <span className="text-xl">{slot.recipe.emoji}</span>
            <span className="flex-1 text-xs font-medium leading-tight text-white line-clamp-2">
              {slot.recipe.title}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(slot.id);
              }}
              className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <RecipePicker
            recipes={recipes}
            slotDate={slotDateISO}
            onAdd={onAdd}
          />
        )}
      </div>
    </div>
  );
}

// ─── Inline recipe picker ─────────────────────────────────────────────────────

interface RecipePickerProps {
  recipes: Array<{ id: string; title: string; emoji: string; bg_color: string; advance_prep_days: number }>;
  slotDate: string;
  onAdd: (slotDate: string, recipeId: string) => void;
}

function RecipePicker({ recipes, slotDate, onAdd }: RecipePickerProps) {
  if (recipes.length === 0) {
    return <span className="text-xs text-slate-600">No recipes</span>;
  }

  return (
    <div className="w-full">
      <select
        className="w-full cursor-pointer rounded-xl border border-dashed border-slate-700 bg-transparent py-2 text-center text-xs text-slate-500 focus:outline-none"
        value=""
        onChange={(e) => {
          if (e.target.value) onAdd(slotDate, e.target.value);
        }}
      >
        <option value="" disabled>+ Add dinner</option>
        {recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.emoji} {r.title}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD in local time (not UTC) */
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
