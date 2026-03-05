import { create } from 'zustand';
import type { MealType } from '@/lib/supabase/types';

// Optimistic drag-drop state for the calendar allocation screen.
// Holds the local slot assignments before they're confirmed by Supabase.

export interface SlotKey {
  dayOfWeek: number; // 0=Mon, 6=Sun
  mealType: MealType;
}

export interface OptimisticSlot extends SlotKey {
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  recipeBgColor: string;
  advancePrepDays: number;
}

interface PlanStore {
  optimisticSlots: OptimisticSlot[];
  draggingRecipeId: string | null;
  draggingAdvancePrepDays: number;

  setOptimisticSlots: (slots: OptimisticSlot[]) => void;
  upsertSlot: (slot: OptimisticSlot) => void;
  removeSlot: (dayOfWeek: number, mealType: MealType) => void;
  setDragging: (recipeId: string | null, advancePrepDays?: number) => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  optimisticSlots: [],
  draggingRecipeId: null,
  draggingAdvancePrepDays: 0,

  setOptimisticSlots: (slots) => set({ optimisticSlots: slots }),

  upsertSlot: (slot) =>
    set((state) => ({
      optimisticSlots: [
        ...state.optimisticSlots.filter(
          (s) => !(s.dayOfWeek === slot.dayOfWeek && s.mealType === slot.mealType)
        ),
        slot,
      ],
    })),

  removeSlot: (dayOfWeek, mealType) =>
    set((state) => ({
      optimisticSlots: state.optimisticSlots.filter(
        (s) => !(s.dayOfWeek === dayOfWeek && s.mealType === mealType)
      ),
    })),

  setDragging: (recipeId, advancePrepDays = 0) =>
    set({ draggingRecipeId: recipeId, draggingAdvancePrepDays: advancePrepDays }),

  reset: () => set({ optimisticSlots: [], draggingRecipeId: null, draggingAdvancePrepDays: 0 }),
}));
