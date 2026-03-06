'use client';

import { Check, Trash2 } from 'lucide-react';
import { formatQuantity } from '@/lib/utils';
import type { GroceryListItem } from '@/hooks/useGroceryList';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  'dairy-eggs': 'Dairy & Eggs',
  'meat-seafood': 'Meat & Seafood',
  frozen: 'Frozen',
  pantry: 'Pantry',
  'snacks-drinks': 'Snacks & Drinks',
  bakery: 'Bakery',
  household: 'Household',
  other: 'Other',
};

// ─── Single row ───────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryListItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${item.checked ? 'opacity-50' : ''}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.checked)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
          item.checked
            ? 'border-primary bg-primary'
            : 'border-slate-600 bg-transparent hover:border-slate-400'
        }`}
        aria-label={item.checked ? 'Mark as unchecked' : 'Mark as checked'}
      >
        {item.checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>

      {/* Name + amount */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${
            item.checked ? 'text-slate-600 line-through' : 'text-white'
          }`}
        >
          {item.name}
        </p>
        <div className="flex items-baseline gap-2">
          {(item.amount !== null || item.unit) && (
            <p className="text-xs text-slate-500">
              {item.amount !== null ? formatQuantity(item.amount) : ''}
              {item.unit ? ` ${item.unit}` : ''}
            </p>
          )}
          {item.estimated_cost != null && (
            <p className="text-xs text-slate-700">£{item.estimated_cost.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Delete (standalone only) */}
      {item.is_standalone && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-700 hover:bg-red-500/10 hover:text-red-400"
          aria-label="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Recipe group ─────────────────────────────────────────────────────────────

function RecipeGroup({
  title,
  items,
  onToggle,
  onDelete,
}: {
  title: string;
  items: GroceryListItem[];
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-4 py-2">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-slate-800 px-4">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ─── GroceryList ──────────────────────────────────────────────────────────────

interface GroceryListProps {
  items: GroceryListItem[];
  onToggle: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function GroceryList({ items, onToggle, onDelete }: GroceryListProps) {
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Group unchecked by recipe
  const recipeMap = new Map<string, { title: string; items: GroceryListItem[] }>();
  const standalone: GroceryListItem[] = [];

  for (const item of unchecked) {
    if (item.is_standalone || !item.recipe_id) {
      standalone.push(item);
    } else {
      const key = item.recipe_id;
      if (!recipeMap.has(key)) {
        recipeMap.set(key, { title: item.recipe_title ?? 'Recipe', items: [] });
      }
      recipeMap.get(key)!.items.push(item);
    }
  }

  const recipeGroups = [...recipeMap.values()];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">✅</span>
        <p className="text-sm text-slate-400">Your grocery list is empty.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Recipe groups */}
      {recipeGroups.map((group) => (
        <RecipeGroup
          key={group.title}
          title={group.title}
          items={group.items}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}

      {/* Standalone items */}
      {standalone.length > 0 && (
        <RecipeGroup
          title="Extra items"
          items={standalone}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      )}

      {/* Checked items (collapsed at bottom) */}
      {checked.length > 0 && (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50">
          <div className="border-b border-slate-800/50 px-4 py-2">
            <p className="text-xs font-semibold text-slate-700">
              Checked ({checked.length})
            </p>
          </div>
          <div className="divide-y divide-slate-800/50 px-4">
            {checked.map((item) => (
              <ItemRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
