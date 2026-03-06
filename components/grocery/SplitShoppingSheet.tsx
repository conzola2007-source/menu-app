'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useAssignGroceryItem, useUnassignGroceryItem } from '@/hooks/useGroceryList';
import type { GroceryListItem } from '@/hooks/useGroceryList';
import type { HouseholdMember } from '@/hooks/useHousehold';

// ─── MemberChip ───────────────────────────────────────────────────────────────

function MemberChip({
  member,
  isAssigned,
  onTap,
}: {
  member: HouseholdMember;
  isAssigned: boolean;
  onTap: () => void;
}) {
  const initials = member.profile.display_name.slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onTap}
      title={member.profile.display_name}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
        isAssigned
          ? 'bg-primary/20 text-primary ring-2 ring-primary'
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}
    >
      {initials}
    </button>
  );
}

// ─── SplitShoppingSheet ───────────────────────────────────────────────────────

interface SplitShoppingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: GroceryListItem[];
  members: HouseholdMember[];
}

export function SplitShoppingSheet({
  isOpen,
  onClose,
  items,
  members,
}: SplitShoppingSheetProps) {
  const assignItem = useAssignGroceryItem();
  const unassignItem = useUnassignGroceryItem();
  const [filterMemberId, setFilterMemberId] = useState<string | null>(null);

  const unchecked = items.filter((i) => !i.checked);
  const displayed = filterMemberId
    ? unchecked.filter((i) => i.assigned_to === filterMemberId)
    : unchecked;

  function handleToggleAssign(item: GroceryListItem, member: HouseholdMember) {
    if (item.assigned_to === member.user_id) {
      unassignItem.mutate(item.id);
    } else {
      assignItem.mutate({ itemId: item.id, userId: member.user_id });
    }
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Split shopping">
      {/* Member filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={() => setFilterMemberId(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterMemberId === null
              ? 'bg-primary text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {members.map((m) => (
          <button
            key={m.user_id}
            type="button"
            onClick={() => setFilterMemberId(filterMemberId === m.user_id ? null : m.user_id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterMemberId === m.user_id
                ? 'bg-primary text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {m.profile.display_name}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="divide-y divide-slate-800 px-4 pb-6">
        {displayed.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {filterMemberId ? 'No items assigned to this person.' : 'No items to assign.'}
          </p>
        ) : (
          displayed.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">{item.name}</p>
                {item.amount != null && (
                  <p className="text-xs text-slate-500">
                    {item.amount} {item.unit ?? ''}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5">
                {members.map((m) => (
                  <MemberChip
                    key={m.user_id}
                    member={m}
                    isAssigned={item.assigned_to === m.user_id}
                    onTap={() => handleToggleAssign(item, m)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Sheet>
  );
}
