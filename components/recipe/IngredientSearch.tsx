'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useIngredients, useCreateIngredient } from '@/hooks/useIngredients';
import { useIngredientLibrary } from '@/hooks/useIngredientLibrary';
import type { IngredientUnit } from '@/lib/supabase/types';
import { INGREDIENT_UNITS } from '@/lib/recipe-constants';

interface IngredientSearchProps {
  householdId: string | null;
  value: string;
  onChange: (name: string, unit?: IngredientUnit) => void;
  placeholder?: string;
}

export function IngredientSearch({
  householdId,
  value,
  onChange,
  placeholder = 'Ingredient name',
}: IngredientSearchProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUnit, setNewUnit] = useState<IngredientUnit>('qty');
  const [newPrice, setNewPrice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: ingredients = [] } = useIngredients(householdId);
  const { data: library = [] } = useIngredientLibrary();
  const createIngredient = useCreateIngredient(householdId ?? '');

  const query = value.trim().toLowerCase();

  // Merge household + global library; household results first
  const filtered = useMemo(() => {
    if (query.length < 1) return [];
    const householdMatches = ingredients
      .filter((i) => i.name.toLowerCase().includes(query))
      .map((i) => ({ id: i.id, name: i.name, default_unit: i.default_unit as string | null, price: i.price, fromLibrary: false }));
    const householdNameSet = new Set(ingredients.map((i) => i.name.toLowerCase()));
    const libraryMatches = library
      .filter((i) => i.name.toLowerCase().includes(query) && !householdNameSet.has(i.name.toLowerCase()))
      .map((i) => ({ id: i.id, name: i.name, default_unit: i.default_unit, price: null as number | null, fromLibrary: true }));
    return [...householdMatches, ...libraryMatches];
  }, [query, ingredients, library]);

  const exactMatch =
    ingredients.some((i) => i.name.toLowerCase() === query) ||
    library.some((i) => i.name.toLowerCase() === query);

  // Close on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function handleCreate() {
    if (!householdId || !value.trim()) return;
    setCreating(false);
    try {
      const ing = await createIngredient.mutateAsync({
        name: value.trim(),
        default_unit: newUnit,
        price: newPrice ? parseFloat(newPrice) : null,
      });
      onChange(ing.name, ing.default_unit);
      setOpen(false);
    } catch {
      // ignore — ingredient might already exist
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setCreating(false);
          }}
          onFocus={() => {
            if (value.trim().length >= 1) setOpen(true);
          }}
          className="w-full rounded-lg border border-slate-600 bg-slate-900 pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Dropdown */}
      {open && value.trim().length >= 1 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          {filtered.length > 0 && (
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.map((ing) => (
                <li key={ing.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(ing.name, (ing.default_unit ?? 'qty') as IngredientUnit);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-700"
                  >
                    <span className="text-white">{ing.name}</span>
                    <span className="text-xs text-slate-500">
                      {ing.default_unit ?? 'qty'}
                      {ing.fromLibrary && <span className="ml-1 text-slate-600">📚</span>}
                      {!ing.fromLibrary && ing.price != null ? ` · $${ing.price.toFixed(2)}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Create new option */}
          {!exactMatch && (
            <div className="border-t border-slate-700">
              {!creating ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create &ldquo;{value.trim()}&rdquo; in ingredient library
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-3">
                  <p className="text-xs font-medium text-slate-400">Save to library (optional details)</p>
                  <div className="flex gap-2">
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value as IngredientUnit)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {INGREDIENT_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void handleCreate()}
                      disabled={createIngredient.isPending}
                      className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {createIngredient.isPending ? 'Saving…' : 'Save & add'}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCreating(false);
                        onChange(value);
                        setOpen(false);
                      }}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
