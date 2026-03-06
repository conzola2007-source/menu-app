'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, SlidersHorizontal, X, CheckCircle, Clock3, Link2 } from 'lucide-react';
import { useRecipes, useHouseholdPool } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useMyRecipeAddRequests, useSubmitRecipeAddRequest, useAddRecipeToPool } from '@/hooks/useRecipeAddRequests';
import { isHead } from '@/lib/roles';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ImportRecipeSheet } from '@/components/recipe/ImportRecipeSheet';
import {
  CUISINE_TYPES, CUISINE_LABELS,
  CARB_TYPES, CARB_LABELS,
  PROTEIN_TYPES, PROTEIN_LABELS,
} from '@/lib/recipe-constants';
import type { ScrapedRecipe } from '@/lib/recipe-scraper';

type CookTimeFilter = 'any' | 'under30' | '30to60' | 'over60';
type SourceFilter = 'all' | 'global' | 'mine';

export default function RecipesPage() {
  const router = useRouter();
  const { data: recipes = [], isLoading, error } = useRecipes();
  const { data: membership } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const householdId = membership?.household?.id ?? null;
  const currentUserIsHead = membership ? isHead(membership.role) : false;
  const [showImport, setShowImport] = useState(false);

  const { data: poolRecipes = [] } = useHouseholdPool(householdId);
  const { data: myRequests = [] } = useMyRecipeAddRequests(householdId);
  const addToPool = useAddRecipeToPool();
  const submitRequest = useSubmitRecipeAddRequest();

  const poolIds = useMemo(() => new Set(poolRecipes.map((r) => r.id)), [poolRecipes]);
  const pendingIds = useMemo(
    () => new Set(myRequests.filter((r) => r.status === 'pending').map((r) => r.recipe_id)),
    [myRequests],
  );

  // ── Filter state ──
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState<string>('all');
  const [carb, setCarb] = useState<string>('all');
  const [protein, setProtein] = useState<string>('all');
  const [cookTime, setCookTime] = useState<CookTimeFilter>('any');
  const [source, setSource] = useState<SourceFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recipes.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q))
        return false;
      if (cuisine !== 'all' && r.cuisine !== cuisine) return false;
      if (carb !== 'all' && r.carb_type !== carb) return false;
      if (protein !== 'all' && r.protein_type !== protein) return false;
      const total = r.prep_time_min + r.cook_time_min;
      if (cookTime === 'under30' && total >= 30) return false;
      if (cookTime === '30to60' && (total < 30 || total > 60)) return false;
      if (cookTime === 'over60' && total <= 60) return false;
      if (source === 'global' && !r.is_global) return false;
      if (source === 'mine' && r.is_global) return false;
      return true;
    });
  }, [recipes, search, cuisine, carb, protein, cookTime, source]);

  const activeFilterCount = [
    cuisine !== 'all', carb !== 'all', protein !== 'all',
    cookTime !== 'any', source !== 'all',
  ].filter(Boolean).length;

  function clearFilters() {
    setCuisine('all'); setCarb('all'); setProtein('all');
    setCookTime('any'); setSource('all');
  }

  function handleImported(data: ScrapedRecipe) {
    sessionStorage.setItem('importedRecipe', JSON.stringify(data));
    router.push('/recipes/new');
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-white">Recipes</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
            >
              <Link2 className="h-3.5 w-3.5" />
              Import URL
            </button>
            <Link
              href="/recipes/new"
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Add
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
              activeFilterCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            {/* Cuisine */}
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Cuisine</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', ...CUISINE_TYPES] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCuisine(c)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      cuisine === c
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {c === 'all' ? 'All' : CUISINE_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Carb */}
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Carb</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', ...CARB_TYPES] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarb(c)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      carb === c
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {c === 'all' ? 'All' : CARB_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Protein */}
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Protein</p>
              <div className="flex flex-wrap gap-1.5">
                {(['all', ...PROTEIN_TYPES] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProtein(p)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      protein === p
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {p === 'all' ? 'All' : PROTEIN_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Cook time */}
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Total time</p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { value: 'any', label: 'Any' },
                    { value: 'under30', label: '< 30 min' },
                    { value: '30to60', label: '30–60 min' },
                    { value: 'over60', label: '60+ min' },
                  ] as { value: CookTimeFilter; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCookTime(value)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      cookTime === value
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <p className="mb-1.5 text-xs text-slate-400">Source</p>
              <div className="flex gap-1.5">
                {(
                  [
                    { value: 'all', label: 'All' },
                    { value: 'global', label: 'Global' },
                    { value: 'mine', label: "Household's" },
                  ] as { value: SourceFilter; label: string }[]
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSource(value)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      source === value
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-800">
                <div className="h-24 rounded-t-2xl bg-slate-700" />
                <div className="p-3">
                  <div className="h-4 rounded bg-slate-700" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 text-center text-sm text-red-400">
            Failed to load recipes. Please try again.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 pt-16 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="font-medium text-white">
              {recipes.length === 0 ? 'No recipes yet' : 'No recipes match your filters'}
            </p>
            <p className="text-sm text-slate-400">
              {recipes.length === 0
                ? 'Add your first household recipe to get started.'
                : 'Try adjusting your search or filters.'}
            </p>
            {recipes.length === 0 && (
              <Link
                href="/recipes/new"
                className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Add first recipe
              </Link>
            )}
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-sm text-primary hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <p className="mb-3 text-xs text-slate-500">
              {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
              {activeFilterCount > 0 || search ? ' (filtered)' : ''}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((recipe) => {
                const isOwn = recipe.created_by === user?.id;
                const inPool = poolIds.has(recipe.id);
                const isPending = pendingIds.has(recipe.id);
                return (
                  <div key={recipe.id} className="flex flex-col gap-1">
                    <RecipeCard recipe={recipe} />
                    {isOwn && !recipe.is_global && householdId && (
                      inPool ? (
                        <div className="flex items-center gap-1 px-1 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          In pool
                        </div>
                      ) : isPending ? (
                        <div className="flex items-center gap-1 px-1 text-xs text-amber-400">
                          <Clock3 className="h-3 w-3" />
                          Pending
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (currentUserIsHead) {
                              addToPool.mutate({ householdId, recipeId: recipe.id });
                            } else {
                              submitRequest.mutate({ householdId, recipeId: recipe.id });
                            }
                          }}
                          className="px-1 text-left text-xs text-primary hover:underline"
                        >
                          {currentUserIsHead ? '+ Add to pool' : '+ Request to add'}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ImportRecipeSheet
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImported={handleImported}
      />
    </div>
  );
}
