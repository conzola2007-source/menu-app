'use client';

import { useDroppable } from '@dnd-kit/core';
import { X, Plus } from 'lucide-react';
import { RecipePill } from './RecipePill';
import { dayName, dayNameShort } from '@/lib/utils';
import type { MealPlanSlot } from '@/hooks/useMealPlan';
import type { MealType } from '@/lib/supabase/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

// ─── Droppable meal slot ──────────────────────────────────────────────────────

function MealSlot({
  dayIndex,
  mealType,
  slot,
  weekStart,
  isBlocked,
  activeSlotId,
  onRemove,
  onView,
}: {
  dayIndex: number;
  mealType: MealType;
  slot: MealPlanSlot | undefined;
  weekStart: string;
  isBlocked: boolean;
  activeSlotId: string | null; // ID of slot currently being dragged (hide it)
  onRemove: (slotId: string) => void;
  onView: (recipeId: string) => void;
}) {
  const droppableId = `droptarget:${dayIndex}:${mealType}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId, disabled: isBlocked });

  const isDraggingThisSlot = slot && slot.id === activeSlotId;

  return (
    <div ref={setNodeRef}>
      <p className="mb-1 text-xs text-slate-600">{MEAL_LABELS[mealType]}</p>

      {slot && !isDraggingThisSlot ? (
        <div
          className={`group relative rounded-lg transition-all ${
            isOver ? 'ring-2 ring-primary/60' : ''
          }`}
        >
          <RecipePill
            recipe={slot.recipe}
            dayOfWeek={dayIndex}
            weekStart={weekStart}
          />
          {/* Actions row: view + remove */}
          <div className="mt-0.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onView(slot.recipe.id)}
              className="text-xs text-slate-600 hover:text-slate-400"
            >
              view
            </button>
            <button
              type="button"
              onClick={() => onRemove(slot.id)}
              className="flex items-center gap-0.5 text-xs text-slate-600 hover:text-red-400"
              aria-label="Remove meal"
            >
              <X className="h-3 w-3" />
              remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex h-10 items-center justify-center rounded-lg border-2 border-dashed text-xs transition-all ${
            isBlocked
              ? 'border-slate-800 text-slate-800 cursor-not-allowed'
              : isOver
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-slate-800 text-slate-700 hover:border-slate-700'
          }`}
        >
          {isBlocked ? (
            <span>blocked</span>
          ) : (
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Drop here
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DayColumn ────────────────────────────────────────────────────────────────

interface DayColumnProps {
  dayIndex: number;
  isToday: boolean;
  /** When true, this column is an invalid drop target (advance prep constraint) */
  isBlocked: boolean;
  slots: Partial<Record<MealType, MealPlanSlot>>;
  weekStart: string;
  activeSlotId: string | null;
  onRemoveSlot: (slotId: string) => void;
  onViewRecipe: (recipeId: string) => void;
}

export function DayColumn({
  dayIndex,
  isToday,
  isBlocked,
  slots,
  weekStart,
  activeSlotId,
  onRemoveSlot,
  onViewRecipe,
}: DayColumnProps) {
  return (
    <div
      className={`rounded-2xl border p-3 transition-all ${
        isBlocked
          ? 'border-slate-800/50 bg-slate-900/50 opacity-50'
          : isToday
            ? 'border-primary/30 bg-primary/5'
            : 'border-slate-800 bg-slate-900'
      }`}
    >
      {/* Day header */}
      <div className="mb-3 flex items-center gap-2">
        <h3
          className={`text-sm font-semibold ${
            isToday ? 'text-primary' : isBlocked ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          <span className="hidden sm:inline">{dayName(dayIndex)}</span>
          <span className="sm:hidden">{dayNameShort(dayIndex)}</span>
        </h3>
        {isToday && (
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
            Today
          </span>
        )}
        {isBlocked && (
          <span className="ml-auto text-xs text-slate-700">prep needed</span>
        )}
      </div>

      {/* Meal slots */}
      <div className="flex flex-col gap-3">
        {MEAL_ORDER.map((mealType) => (
          <MealSlot
            key={mealType}
            dayIndex={dayIndex}
            mealType={mealType}
            slot={slots[mealType]}
            weekStart={weekStart}
            isBlocked={isBlocked}
            activeSlotId={activeSlotId}
            onRemove={onRemoveSlot}
            onView={onViewRecipe}
          />
        ))}
      </div>
    </div>
  );
}
