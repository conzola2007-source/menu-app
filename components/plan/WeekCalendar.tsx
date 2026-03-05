'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { DayColumn } from './DayColumn';
import { RecipePill } from './RecipePill';
import { canPlaceRecipeOnDay, advancePrepErrorMessage } from '@/lib/utils';
import type { WeekPlanData, SlotRecipe, MealPlanSlot } from '@/hooks/useMealPlan';
import type { MealType } from '@/lib/supabase/types';

// ─── Drag ID helpers ──────────────────────────────────────────────────────────

// Shortlist draggable: "shortlist:{recipeId}"
// Calendar slot draggable: "calslot:{dayOfWeek}:{mealType}:{slotId}:{recipeId}"
// Droppable target: "droptarget:{dayOfWeek}:{mealType}"

function makeShortlistId(recipeId: string) {
  return `shortlist:${recipeId}`;
}

function makeCalSlotId(slot: MealPlanSlot) {
  return `calslot:${slot.day_of_week}:${slot.meal_type}:${slot.id}:${slot.recipe.id}`;
}

function parseDropTarget(id: string): { dayOfWeek: number; mealType: MealType } | null {
  const parts = id.split(':');
  if (parts[0] !== 'droptarget' || parts.length !== 3) return null;
  return { dayOfWeek: Number(parts[1]), mealType: parts[2] as MealType };
}

function parseActiveId(id: string): {
  type: 'shortlist' | 'calslot';
  recipeId: string;
  slotId?: string;
} | null {
  const parts = id.split(':');
  if (parts[0] === 'shortlist' && parts.length === 2)
    return { type: 'shortlist', recipeId: parts[1] };
  if (parts[0] === 'calslot' && parts.length === 5)
    return { type: 'calslot', slotId: parts[3], recipeId: parts[4] };
  return null;
}

// ─── Draggable shortlist pill ─────────────────────────────────────────────────

function DraggableShortlistPill({ recipe }: { recipe: SlotRecipe }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: makeShortlistId(recipe.id),
    data: { recipe },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <RecipePill recipe={recipe} compact />
    </div>
  );
}

// ─── Draggable calendar slot ──────────────────────────────────────────────────

function DraggableCalSlot({
  slot,
  weekStart,
  activeSlotId,
  onRemove,
  onView,
}: {
  slot: MealPlanSlot;
  weekStart: string;
  activeSlotId: string | null;
  onRemove: (slotId: string) => void;
  onView: (recipeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: makeCalSlotId(slot),
    data: { slot },
  });

  if (isDragging) return null; // the DragOverlay renders the clone

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <RecipePill recipe={slot.recipe} dayOfWeek={slot.day_of_week} weekStart={weekStart} />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeekCalendarProps {
  planData: WeekPlanData;
  shortlist: SlotRecipe[];
  todayIndex: number;
  onAddSlot: (args: {
    recipeId: string;
    dayOfWeek: number;
    mealType: MealType;
    recipe: SlotRecipe;
  }) => void;
  onMoveSlot: (args: { slotId: string; newDayOfWeek: number; newMealType: MealType }) => void;
  onRemoveSlot: (slotId: string) => void;
  onToast: (message: string, type?: 'error' | 'info') => void;
}

// ─── WeekCalendar ─────────────────────────────────────────────────────────────

export function WeekCalendar({
  planData,
  shortlist,
  todayIndex,
  onAddSlot,
  onMoveSlot,
  onRemoveSlot,
  onToast,
}: WeekCalendarProps) {
  const router = useRouter();
  const [activeRecipe, setActiveRecipe] = useState<SlotRecipe | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [draggingAdvancePrepDays, setDraggingAdvancePrepDays] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const parsed = parseActiveId(String(event.active.id));
      if (!parsed) return;

      if (parsed.type === 'shortlist') {
        const recipe = shortlist.find((r) => r.id === parsed.recipeId);
        if (recipe) {
          setActiveRecipe(recipe);
          setDraggingAdvancePrepDays(recipe.advance_prep_days);
          setActiveSlotId(null);
        }
      } else {
        // Dragging from calendar
        const slot = planData.slots.find((s) => s.id === parsed.slotId);
        if (slot) {
          setActiveRecipe(slot.recipe);
          setDraggingAdvancePrepDays(slot.recipe.advance_prep_days);
          setActiveSlotId(slot.id);
        }
      }
    },
    [shortlist, planData.slots],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveRecipe(null);
      setActiveSlotId(null);
      setDraggingAdvancePrepDays(0);

      const { active, over } = event;
      if (!over || !activeRecipe) return;

      const target = parseDropTarget(String(over.id));
      if (!target) return;

      const parsed = parseActiveId(String(active.id));
      if (!parsed) return;

      const { dayOfWeek, mealType } = target;

      // Advance prep constraint check
      if (!canPlaceRecipeOnDay(activeRecipe.advance_prep_days, dayOfWeek)) {
        onToast(advancePrepErrorMessage(activeRecipe.advance_prep_days, activeRecipe.title), 'error');
        return;
      }

      if (parsed.type === 'shortlist') {
        onAddSlot({ recipeId: activeRecipe.id, dayOfWeek, mealType, recipe: activeRecipe });
      } else if (parsed.slotId) {
        // Moving from calendar to another slot
        const isSameSlot =
          planData.slotsByDay[dayOfWeek]?.[mealType]?.id === undefined ||
          planData.slotsByDay[dayOfWeek]?.[mealType]?.id === parsed.slotId;

        if (!isSameSlot || dayOfWeek !== planData.slots.find((s) => s.id === parsed.slotId)?.day_of_week ||
          mealType !== planData.slots.find((s) => s.id === parsed.slotId)?.meal_type) {
          onMoveSlot({ slotId: parsed.slotId, newDayOfWeek: dayOfWeek, newMealType: mealType });
        }
      }
    },
    [activeRecipe, onAddSlot, onMoveSlot, onToast, planData],
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* ── Shortlist ──────────────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recipes — drag to add
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shortlist.length === 0 ? (
            <p className="py-2 text-xs text-slate-600 italic">No recipes yet.</p>
          ) : (
            shortlist.map((recipe) => (
              <DraggableShortlistPill key={recipe.id} recipe={recipe} />
            ))
          )}
        </div>
      </div>

      {/* ── 7 day columns ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
          const isBlocked =
            draggingAdvancePrepDays > 0 &&
            !canPlaceRecipeOnDay(draggingAdvancePrepDays, dayIndex);

          return (
            <DayColumn
              key={dayIndex}
              dayIndex={dayIndex}
              isToday={dayIndex === todayIndex}
              isBlocked={isBlocked}
              slots={planData.slotsByDay[dayIndex] ?? {}}
              weekStart={planData.weekStart}
              activeSlotId={activeSlotId}
              onRemoveSlot={onRemoveSlot}
              onViewRecipe={(recipeId) => router.push(`/recipes/${recipeId}`)}
            />
          );
        })}
      </div>

      {/* ── Drag overlay ──────────────────────────────────────────────────── */}
      <DragOverlay>
        {activeRecipe && (
          <RecipePill recipe={activeRecipe} compact className="shadow-2xl opacity-90" />
        )}
      </DragOverlay>
    </DndContext>
  );
}
