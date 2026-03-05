import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CUISINE_LABELS } from '@/lib/recipe-constants';
import type { Recipe } from '@/hooks/useRecipes';

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

export function RecipeCard({ recipe, className }: RecipeCardProps) {
  const totalTime = recipe.prep_time_min + recipe.cook_time_min;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={cn(
        'block overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 transition-colors hover:border-slate-500 active:scale-[0.98]',
        className
      )}
    >
      {/* Coloured header */}
      <div
        className="flex h-24 items-center justify-center text-4xl"
        style={{ backgroundColor: recipe.bg_color }}
      >
        {recipe.emoji}
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
          {recipe.title}
        </h3>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
          </span>

          {recipe.advance_prep_days > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
              {recipe.advance_prep_days}d prep
            </span>
          )}

          {!recipe.is_global && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
              Yours
            </span>
          )}
        </div>

        {/* Time row */}
        {totalTime > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            {recipe.prep_time_min > 0 && <span>🔪 {recipe.prep_time_min}m</span>}
            {recipe.cook_time_min > 0 && <span>🔥 {recipe.cook_time_min}m</span>}
            <span className="ml-auto font-medium text-slate-300">{totalTime}m</span>
          </div>
        )}
      </div>
    </Link>
  );
}
