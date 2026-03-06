'use client';

import { useState } from 'react';
import { Plus, Package, Check, X, Pencil } from 'lucide-react';
import { useIngredients, useCreateIngredient, useUpdateIngredient } from '@/hooks/useIngredients';
import { INGREDIENT_UNITS } from '@/lib/recipe-constants';
import type { IngredientUnit } from '@/lib/supabase/types';
import type { Ingredient } from '@/hooks/useIngredients';

interface IngredientListProps {
  householdId: string;
}

interface AddForm {
  name: string;
  default_unit: IngredientUnit;
  pack_qty: string;
  pack_price: string;
}

export function IngredientList({ householdId }: IngredientListProps) {
  const { data: ingredients = [], isLoading } = useIngredients(householdId);
  const createIngredient = useCreateIngredient(householdId);
  const updateIngredient = useUpdateIngredient(householdId);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ name: '', default_unit: 'qty', pack_qty: '', pack_price: '' });
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<IngredientUnit>('qty');
  const [editPackQty, setEditPackQty] = useState('');
  const [editPackPrice, setEditPackPrice] = useState('');

  async function handleAdd() {
    if (!addForm.name.trim()) { setAddError('Name required.'); return; }
    setAddError('');
    try {
      await createIngredient.mutateAsync({
        name: addForm.name.trim(),
        default_unit: addForm.default_unit,
        pack_qty: addForm.pack_qty ? parseFloat(addForm.pack_qty) : null,
        pack_price: addForm.pack_price ? parseFloat(addForm.pack_price) : null,
      });
      setAdding(false);
      setAddForm({ name: '', default_unit: 'qty', pack_qty: '', pack_price: '' });
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add ingredient.');
    }
  }

  function startEdit(ing: Ingredient) {
    setEditingId(ing.id);
    setEditUnit(ing.default_unit);
    setEditPackQty(ing.pack_qty != null ? String(ing.pack_qty) : '');
    setEditPackPrice(ing.pack_price != null ? String(ing.pack_price) : '');
  }

  async function saveEdit(id: string) {
    await updateIngredient.mutateAsync({
      id,
      default_unit: editUnit,
      pack_qty: editPackQty ? parseFloat(editPackQty) : null,
      pack_price: editPackPrice ? parseFloat(editPackPrice) : null,
    });
    setEditingId(null);
  }

  function formatCost(ing: Ingredient): string | null {
    if (ing.per_unit_cost == null) return null;
    return `£${ing.per_unit_cost.toFixed(2)} / ${ing.default_unit}`;
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ingredient Library · {ingredients.length}
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Add form */}
        {adding && (
          <div className="border-b border-slate-800 p-3 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Ingredient name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              autoFocus
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={addForm.default_unit}
                onChange={(e) => setAddForm((f) => ({ ...f, default_unit: e.target.value as IngredientUnit }))}
                className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {INGREDIENT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Pack qty"
                value={addForm.pack_qty}
                onChange={(e) => setAddForm((f) => ({ ...f, pack_qty: e.target.value }))}
                className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Pack price"
                value={addForm.pack_price}
                onChange={(e) => setAddForm((f) => ({ ...f, pack_price: e.target.value }))}
                className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            {addForm.pack_qty && addForm.pack_price && (
              <p className="text-xs text-slate-500">
                Unit cost: £{(parseFloat(addForm.pack_price) / parseFloat(addForm.pack_qty)).toFixed(2)} / {addForm.default_unit}
              </p>
            )}
            {addError && <p className="text-xs text-red-400">{addError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={createIngredient.isPending}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {createIngredient.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setAddError(''); }}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-800" />
            ))}
          </div>
        ) : ingredients.length === 0 && !adding ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Package className="h-7 w-7 text-slate-600" />
            <p className="text-xs text-slate-500">
              No ingredients yet — add some to build your household library
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {ingredients.map((ing) => {
              const cost = formatCost(ing);
              return (
                <li key={ing.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex-1 truncate text-sm text-white">{ing.name}</span>

                  {editingId === ing.id ? (
                    <>
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value as IngredientUnit)}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none"
                      >
                        {INGREDIENT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={editPackQty}
                        onChange={(e) => setEditPackQty(e.target.value)}
                        placeholder="Qty"
                        className="w-14 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPackPrice}
                        onChange={(e) => setEditPackPrice(e.target.value)}
                        placeholder="£price"
                        className="w-16 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void saveEdit(ing.id)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-500">{ing.default_unit}</span>
                      {cost && <span className="text-xs text-slate-400">{cost}</span>}
                      <button
                        type="button"
                        onClick={() => startEdit(ing)}
                        className="text-slate-600 hover:text-slate-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
