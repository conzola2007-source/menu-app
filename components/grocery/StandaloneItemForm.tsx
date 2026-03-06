'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import type { GroceryCategory, IngredientUnit } from '@/lib/supabase/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: GroceryCategory; label: string }[] = [
  { value: 'produce',       label: 'Produce' },
  { value: 'dairy-eggs',    label: 'Dairy & Eggs' },
  { value: 'meat-seafood',  label: 'Meat & Seafood' },
  { value: 'frozen',        label: 'Frozen' },
  { value: 'pantry',        label: 'Pantry' },
  { value: 'snacks-drinks', label: 'Snacks & Drinks' },
  { value: 'bakery',        label: 'Bakery' },
  { value: 'household',     label: 'Household' },
  { value: 'other',         label: 'Other' },
];

const UNITS: IngredientUnit[] = [
  'qty', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'piece', 'pack', 'bag', 'bottle',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface StandaloneItemFormProps {
  isOpen: boolean;
  onAdd: (item: {
    name: string;
    amount: number | null;
    unit: IngredientUnit | null;
    category: GroceryCategory;
  }) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StandaloneItemForm({ isOpen, onAdd, onClose, isSubmitting }: StandaloneItemFormProps) {
  const [name,      setName]      = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [unit,      setUnit]      = useState<IngredientUnit>('qty');
  const [category,  setCategory]  = useState<GroceryCategory>('other');
  const [error,     setError]     = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Item name is required.'); return; }
    const amount = amountStr ? parseFloat(amountStr) : null;
    onAdd({
      name: trimmed,
      amount: amount && !isNaN(amount) ? amount : null,
      unit: amount ? unit : null,
      category,
    });
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Add item">
      <div className="px-5 py-4 pb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="item-name">
              Item name *
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Olive oil"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-primary focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Amount + unit */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-slate-500" htmlFor="item-amount">
                Amount
              </label>
              <input
                id="item-amount"
                type="number"
                min="0"
                step="0.1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="—"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs text-slate-500" htmlFor="item-unit">
                Unit
              </label>
              <select
                id="item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as IngredientUnit)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="item-category">
              Category
            </label>
            <select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as GroceryCategory)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Adding…' : 'Add to list'}
          </button>
        </form>
      </div>
    </Sheet>
  );
}
