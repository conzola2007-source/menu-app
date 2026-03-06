'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { MealPlanSlot } from '@/hooks/useMealPlan';
import { useUpdateSlotChef, useUpdateSlotServings } from '@/hooks/useMealPlan';
import { useRecipeCooks } from '@/hooks/useRecipeCooks';
import type { VoteType } from '@/lib/supabase/types';
import { RecipeTallySheet } from './RecipeTallySheet';

interface Member {
  user_id: string;
  profile: { display_name: string };
}

interface DayCellProps {
  date: Date;
  slot: MealPlanSlot | null;
  isToday: boolean;
  recipes: Array<{ id: string; title: string; emoji: string; bg_color: string; advance_prep_days: number }>;
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[];
  totalMembers: number;
  onAdd: (slotDate: string, recipeId: string) => void;
  onRemove: (slotId: string) => void;
  householdId: string | null;
  isHead: boolean;
  members: Member[];
}

const DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DayCell({
  date, slot, isToday, recipes, allVotes, totalMembers, onAdd, onRemove,
  householdId, isHead, members,
}: DayCellProps) {
  const dayName     = DAY_NAMES[date.getDay()];
  const dayNum      = date.getDate();
  const month       = MONTH_NAMES[date.getMonth()];
  const slotDateISO = toLocalISODate(date);
  const [showTallySheet, setShowTallySheet] = useState(false);

  const { data: cooks = [] } = useRecipeCooks(
    slot?.recipe.id ?? null,
    householdId,
  );
  const updateChef     = useUpdateSlotChef();
  const updateServings = useUpdateSlotServings();

  const displayServings = slot?.servings_override ?? slot?.recipe.servings ?? 1;

  return (
    <>
      <div
        className={`relative flex flex-col rounded-2xl border bg-slate-900 overflow-hidden aspect-[9/16] ${
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
        <div className="flex flex-1 flex-col gap-1.5 p-2">
          {slot ? (
            <>
              {/* Recipe chip */}
              <div
                className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                style={{ backgroundColor: slot.recipe.bg_color + '33' }}
              >
                <span className="text-xl">{slot.recipe.emoji}</span>
                <span className="flex-1 text-xs font-medium leading-tight text-white line-clamp-2">
                  {slot.recipe.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
                  className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Chef picker — heads only, when cooks list is non-empty */}
              {isHead && cooks.length > 0 && (
                <div className="flex flex-wrap gap-1 px-0.5">
                  {cooks.map((cook) => {
                    const member = members.find((m) => m.user_id === cook.user_id);
                    const name   = member?.profile.display_name ?? 'Member';
                    const isChef = slot.chef_id === cook.user_id;
                    return (
                      <button
                        key={cook.id}
                        type="button"
                        onClick={() =>
                          updateChef.mutate({
                            slotId: slot.id,
                            chefId: isChef ? null : cook.user_id,
                          })
                        }
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 transition-all ${
                          isChef
                            ? 'bg-amber-500/40 ring-amber-400'
                            : 'bg-slate-600 ring-transparent hover:ring-slate-500'
                        }`}
                        title={name}
                        aria-label={isChef ? `Remove ${name} as chef` : `Set ${name} as chef`}
                      >
                        {name.charAt(0).toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Serves stepper — heads only */}
              {isHead && (
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className="text-[10px] text-slate-500">Serves</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateServings.mutate({
                        slotId: slot.id,
                        servingsOverride: Math.max(1, displayServings - 1),
                      })
                    }
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs text-white hover:bg-slate-700"
                    aria-label="Decrease servings"
                  >
                    −
                  </button>
                  <span className="min-w-[1.25rem] text-center text-xs font-medium text-white">
                    {displayServings}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateServings.mutate({
                        slotId: slot.id,
                        servingsOverride: Math.min(20, displayServings + 1),
                      })
                    }
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs text-white hover:bg-slate-700"
                    aria-label="Increase servings"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          ) : recipes.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-xs text-slate-600">No recipes</span>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => setShowTallySheet(true)}
                className="w-full rounded-xl border border-dashed border-slate-700 py-2 text-center text-xs text-slate-500 hover:border-slate-500 hover:text-slate-400"
              >
                + Add dinner
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RecipeTallySheet — always rendered, Sheet controls visibility */}
      <RecipeTallySheet
        isOpen={showTallySheet}
        recipes={recipes}
        allVotes={allVotes}
        totalMembers={totalMembers}
        slotDate={slotDateISO}
        onAdd={onAdd}
        onClose={() => setShowTallySheet(false)}
      />
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD in local time (not UTC) */
function toLocalISODate(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
