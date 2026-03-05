import { create } from 'zustand';
import type { StorageLocation, IngredientUnit } from '@/lib/supabase/types';

// Pantry check session state — lives only in memory (not persisted to DB).
// The result of the session IS written back to Supabase on completion.

export interface PantryCheckItem {
  groceryItemId: string;
  name: string;
  amount: number | null;
  unit: IngredientUnit | null;
  storageLocation: StorageLocation;
  recipeNames: string[];
  // Result
  status: 'pending' | 'have' | 'need' | 'partial';
  amountHave?: number; // for partial
}

interface GroceryStore {
  checkItems: PantryCheckItem[];
  currentIndex: number;
  currentSection: StorageLocation;
  isComplete: boolean;

  initPantryCheck: (items: PantryCheckItem[]) => void;
  markHave: (groceryItemId: string) => void;
  markNeed: (groceryItemId: string) => void;
  markPartial: (groceryItemId: string, amountHave: number) => void;
  advance: () => void;
  reset: () => void;
}

const SECTION_ORDER: StorageLocation[] = ['freezer', 'fridge', 'pantry', 'other'];

export const useGroceryStore = create<GroceryStore>((set, get) => ({
  checkItems: [],
  currentIndex: 0,
  currentSection: 'freezer',
  isComplete: false,

  initPantryCheck: (items) =>
    set({
      checkItems: items,
      currentIndex: 0,
      currentSection: SECTION_ORDER[0],
      isComplete: false,
    }),

  markHave: (groceryItemId) =>
    set((state) => ({
      checkItems: state.checkItems.map((item) =>
        item.groceryItemId === groceryItemId ? { ...item, status: 'have' } : item
      ),
    })),

  markNeed: (groceryItemId) =>
    set((state) => ({
      checkItems: state.checkItems.map((item) =>
        item.groceryItemId === groceryItemId ? { ...item, status: 'need' } : item
      ),
    })),

  markPartial: (groceryItemId, amountHave) =>
    set((state) => ({
      checkItems: state.checkItems.map((item) =>
        item.groceryItemId === groceryItemId ? { ...item, status: 'partial', amountHave } : item
      ),
    })),

  advance: () => {
    const { checkItems, currentIndex, currentSection } = get();
    const nextIndex = currentIndex + 1;
    const pendingInSection = checkItems.filter(
      (i) => i.storageLocation === currentSection && i.status === 'pending'
    );

    if (pendingInSection.length === 0) {
      // Move to next section
      const sectionIdx = SECTION_ORDER.indexOf(currentSection);
      const nextSection = SECTION_ORDER[sectionIdx + 1];
      if (!nextSection) {
        set({ isComplete: true });
      } else {
        set({ currentSection: nextSection, currentIndex: 0 });
      }
    } else {
      set({ currentIndex: nextIndex });
    }
  },

  reset: () => set({ checkItems: [], currentIndex: 0, currentSection: 'freezer', isComplete: false }),
}));
