'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { VoteType } from '@/lib/supabase/types';

interface Recipe {
  id: string;
  title: string;
  emoji: string;
  bg_color: string;
}

interface RecipeTallySheetProps {
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
  recipes,
  allVotes,
  totalMembers,
  slotDate,
  onAdd,
  onClose,
}: RecipeTallySheetProps) {
  const scored = scoreRecipes(recipes, allVotes).sort((a, b) => b.score - a.score);

  // Group into tiers (only non-empty groups shown)
  const superPicks = scored.filter((r) => r.superCount > 0);
  const popular = scored.filter((r) => r.superCount === 0 && r.yesCount > 0);
  const unvoted = scored.filter((r) => r.score === 0);

  const groups = [
    { label: 'Super picks', items: superPicks },
    { label: 'Popular', items: popular },
    { label: 'Not voted yet', items: unvoted },
  ].filter((g) => g.items.length > 0);

  // If no vote data at all, show flat list
  const hasVotes = allVotes.length > 0;

  function handlePick(recipeId: string) {
    onAdd(slotDate, recipeId);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Outer wrapper — owns drag + position only, no background */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0.08, bottom: 0 }}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) onClose();
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 250 }}
        className="fixed inset-x-0 bottom-0 z-50"
      >
        {/* Visible sheet card */}
        <div className="flex max-h-[82vh] flex-col rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl">
          {/* Handle */}
          <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
            <div className="h-1 w-10 rounded-full bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Pick a dinner</p>
              {totalMembers > 0 && hasVotes && (
                <p className="text-xs text-slate-500">{totalMembers} household member{totalMembers !== 1 ? 's' : ''} voted</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Recipe list */}
          <div className="overflow-y-auto pb-10">
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
              // Flat list if no votes yet
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
        </div>

        {/* Bottomless extension — prevents any gap showing below the sheet when dragging down */}
        <div className="h-[50vh] bg-slate-900" />
      </motion.div>
    </>
  );
}
