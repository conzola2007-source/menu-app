'use client';

import { Sheet } from '@/components/ui/Sheet';
import type { VoteType } from '@/lib/supabase/types';

interface Recipe {
  id: string;
  title: string;
  emoji: string;
  bg_color: string;
}

interface RecipeTallySheetProps {
  isOpen: boolean;
  recipes: Recipe[];
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[];
  totalMembers: number;
  slotDate: string;
  onAdd: (slotDate: string, recipeId: string) => void;
  onClose: () => void;
}

interface RecipeWithScore {
  recipe: Recipe;
  superCount: number;
  yesCount: number;
  score: number;
}

function scoreRecipes(
  recipes: Recipe[],
  allVotes: { recipe_id: string; vote: VoteType }[],
): RecipeWithScore[] {
  return recipes.map((recipe) => {
    const votes = allVotes.filter((v) => v.recipe_id === recipe.id);
    const superCount = votes.filter((v) => v.vote === 'super').length;
    const yesCount = votes.filter((v) => v.vote === 'yes').length;
    const score = superCount * 2 + yesCount;
    return { recipe, superCount, yesCount, score };
  });
}

export function RecipeTallySheet({
  isOpen,
  recipes,
  allVotes,
  totalMembers,
  slotDate,
  onAdd,
  onClose,
}: RecipeTallySheetProps) {
  const scored = scoreRecipes(recipes, allVotes).sort((a, b) => b.score - a.score);

  const superPicks = scored.filter((r) => r.superCount > 0);
  const popular    = scored.filter((r) => r.superCount === 0 && r.yesCount > 0);
  const unvoted    = scored.filter((r) => r.score === 0);

  const groups = [
    { label: 'Super picks', items: superPicks },
    { label: 'Popular',     items: popular },
    { label: 'Not voted yet', items: unvoted },
  ].filter((g) => g.items.length > 0);

  const hasVotes = allVotes.length > 0;

  function handlePick(recipeId: string) {
    onAdd(slotDate, recipeId);
    onClose();
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div>
          <p className="text-sm font-semibold text-white">Pick a dinner</p>
          {totalMembers > 0 && hasVotes && (
            <p className="text-xs text-slate-500">
              {totalMembers} household member{totalMembers !== 1 ? 's' : ''} voted
            </p>
          )}
        </div>
      }
    >
      <div className="pb-8">
        {hasVotes ? (
          groups.map((group) => (
            <div key={group.label}>
              <p className="sticky top-0 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.label}
              </p>
              {group.items.map(({ recipe, superCount, yesCount }) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handlePick(recipe.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 active:bg-slate-700"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: recipe.bg_color }}
                  >
                    {recipe.emoji}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white">{recipe.title}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    {superCount > 0 && <span>⭐{superCount}</span>}
                    {yesCount > 0 && <span>👍{yesCount}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))
        ) : (
          scored.map(({ recipe }) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => handlePick(recipe.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 active:bg-slate-700"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl"
                style={{ backgroundColor: recipe.bg_color }}
              >
                {recipe.emoji}
              </span>
              <span className="flex-1 text-sm font-medium text-white">{recipe.title}</span>
            </button>
          ))
        )}
      </div>
    </Sheet>
  );
}
