'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Clock, ChefHat, Users, AlertTriangle, UtensilsCrossed, Heart, StickyNote, Trash2 } from 'lucide-react';
import { useRecipeDetail } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipeCooks, useAddSelfAsCook, useRemoveSelfAsCook } from '@/hooks/useRecipeCooks';
import { useRecipeRatings, useUpsertRating } from '@/hooks/useRecipeRatings';
import { useRecipeFavourites, useToggleFavourite } from '@/hooks/useRecipeFavourites';
import { useRecipeNotes, useUpsertRecipeNote, useDeleteRecipeNote } from '@/hooks/useRecipeNotes';
import { RatingStars } from '@/components/recipe/RatingStars';
import { formatQuantity } from '@/lib/utils';
import { CUISINE_LABELS, STORAGE_LABELS } from '@/lib/recipe-constants';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: membership } = useHousehold();
  const householdId = (membership as unknown as { household?: { id: string } } | null)?.household?.id;

  const { data: recipe, isLoading, error } = useRecipeDetail(id ?? null);
  const { data: cooks = [] } = useRecipeCooks(id ?? null, householdId ?? null);
  const { data: houseIngredients = [] } = useIngredients(householdId ?? null);
  const addSelfAsCook = useAddSelfAsCook();
  const removeSelfAsCook = useRemoveSelfAsCook();

  const { data: ratings = [] } = useRecipeRatings(id ?? null, householdId ?? null);
  const upsertRating = useUpsertRating();
  const { data: favourites = [] } = useRecipeFavourites(householdId ?? null);
  const toggleFavourite = useToggleFavourite();

  const { data: notes = [] } = useRecipeNotes(id ?? null, householdId ?? null);
  const upsertNote = useUpsertRecipeNote();
  const deleteNote = useDeleteRecipeNote();

  // Servings scaler
  const [scaledServings, setScaledServings] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-48 bg-slate-700" />
          <div className="p-4">
            <div className="h-6 w-3/4 rounded bg-slate-700" />
            <div className="mt-2 h-4 w-1/2 rounded bg-slate-700" />
            <div className="mt-4 h-4 rounded bg-slate-700" />
            <div className="mt-2 h-4 w-5/6 rounded bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6">
        <span className="text-4xl">😕</span>
        <p className="text-white">Recipe not found.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const baseServings = recipe.servings;
  const displayServings = scaledServings ?? baseServings;
  const scaleFactor = displayServings / baseServings;

  const canEdit =
    !recipe.is_global &&
    recipe.household_id === householdId &&
    !!user;

  const isCook = cooks.some((c) => c.user_id === user?.id);
  const members = membership?.members ?? [];
  const myNote = notes.find((n) => n.user_id === user?.id);
  const isFav = favourites.some((f) => f.recipe_id === id);
  const myRating = ratings.find((r) => r.user_id === user?.id);
  const avgStars =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.stars, 0) / ratings.length) * 10) / 10
      : null;

  const totalTime = recipe.prep_time_min + recipe.cook_time_min;

  // Estimated cost from household ingredient library
  const ingredientCostMap = new Map(
    houseIngredients
      .filter((i) => i.per_unit_cost != null)
      .map((i) => [i.name.toLowerCase(), i.per_unit_cost!]),
  );
  let estimatedCost: number | null = null;
  if (recipe.ingredients.length > 0 && ingredientCostMap.size > 0) {
    let total = 0;
    let matched = 0;
    for (const ing of recipe.ingredients) {
      const unitCost = ingredientCostMap.get(ing.name.toLowerCase());
      if (unitCost != null) {
        total += ing.amount * unitCost * scaleFactor;
        matched++;
      }
    }
    if (matched > 0) estimatedCost = total;
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Hero */}
      <div
        className="relative flex h-48 items-center justify-center text-6xl"
        style={{ backgroundColor: recipe.bg_color }}
      >
        {recipe.emoji}

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Right buttons */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {/* Favourite */}
          {householdId && user && (
            <button
              type="button"
              onClick={() =>
                toggleFavourite.mutate({ recipeId: recipe.id, householdId, isFav })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isFav ? 'fill-red-400 text-red-400' : 'text-white'}`}
              />
            </button>
          )}
          {/* Edit */}
          {canEdit && (
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
              aria-label="Edit recipe"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Title + cuisine */}
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-white">{recipe.title}</h1>
          <span className="mt-1 shrink-0 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
            {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
          </span>
        </div>

        {recipe.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{recipe.description}</p>
        )}

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
          {recipe.prep_time_min > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Prep: {recipe.prep_time_min}m</span>
            </div>
          )}
          {recipe.cook_time_min > 0 && (
            <div className="flex items-center gap-1.5">
              <ChefHat className="h-4 w-4 text-slate-400" />
              <span>Cook: {recipe.cook_time_min}m</span>
            </div>
          )}
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5 font-medium text-white">
              <span>Total: {totalTime}m</span>
            </div>
          )}
        </div>

        {/* Estimated cost */}
        {estimatedCost != null && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
            <span>Est. cost:</span>
            <span className="font-medium text-slate-300">£{estimatedCost.toFixed(2)}</span>
            <span className="text-xs text-slate-600">for {displayServings} serving{displayServings !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Advance prep banner */}
        {recipe.advance_prep_days > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-medium">
                Needs {recipe.advance_prep_days} day{recipe.advance_prep_days > 1 ? 's' : ''} advance prep
              </span>
              {recipe.advance_prep_note && (
                <p className="mt-0.5 text-amber-400/80">{recipe.advance_prep_note}</p>
              )}
            </div>
          </div>
        )}

        {/* Servings scaler */}
        {recipe.ingredients.length > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
            <Users className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-sm text-slate-300">Servings</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScaledServings(Math.max(1, displayServings - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-600"
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium text-white">
                {displayServings}
              </span>
              <button
                type="button"
                onClick={() => setScaledServings(Math.min(20, displayServings + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-600"
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
            {scaleFactor !== 1 && (
              <button
                type="button"
                onClick={() => setScaledServings(null)}
                className="ml-2 text-xs text-slate-500 hover:text-slate-300"
              >
                reset
              </button>
            )}
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-semibold text-white">Ingredients</h2>
            <ul className="flex flex-col divide-y divide-slate-800">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-white">{ing.name}</span>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>
                      {formatQuantity(ing.amount, scaleFactor)} {ing.unit}
                    </span>
                    <span
                      className="rounded bg-slate-800 px-1.5 py-0.5 text-xs"
                      title={`Stored in: ${STORAGE_LABELS[ing.storage_location]}`}
                    >
                      {ing.storage_location === 'fridge'
                        ? '❄️'
                        : ing.storage_location === 'freezer'
                        ? '🧊'
                        : ing.storage_location === 'pantry'
                        ? '🥫'
                        : '📦'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-semibold text-white">Steps</h2>
            <ol className="flex flex-col gap-4">
              {recipe.steps.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-300">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Cook List */}
        {householdId && (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <UtensilsCrossed className="h-4 w-4 text-slate-400" />
              Who can cook this
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {cooks.map((cook) => {
                const member = members.find((m) => m.user_id === cook.user_id);
                const name = member?.profile.display_name ?? 'Member';
                return (
                  <div
                    key={cook.id}
                    className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-xs text-white"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    {name}
                  </div>
                );
              })}
              {cooks.length === 0 && (
                <p className="text-sm text-slate-500">No cooks assigned yet.</p>
              )}
            </div>
            {user && (
              <div className="mt-3">
                {isCook ? (
                  <button
                    type="button"
                    onClick={() => removeSelfAsCook.mutate({ recipeId: id!, householdId })}
                    disabled={removeSelfAsCook.isPending}
                    className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
                  >
                    Remove myself from cook list
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => addSelfAsCook.mutate({ recipeId: id!, householdId })}
                    disabled={addSelfAsCook.isPending}
                    className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/30 disabled:opacity-50"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    I can cook this too
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* Ratings */}
        {householdId && (
          <section className="mt-6">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-white">Ratings</h2>
              {avgStars != null && (
                <span className="text-sm text-amber-400 font-medium">
                  {avgStars.toFixed(1)} ★ · {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* My rating */}
            {user && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
                <span className="text-sm text-slate-300">Your rating</span>
                <div className="ml-auto">
                  <RatingStars
                    value={myRating?.stars ?? 0}
                    onChange={(stars) => {
                      if (!id || !householdId) return;
                      if (stars === 0) return; // toggling off handled by tap same star
                      upsertRating.mutate({ recipeId: id, householdId, stars });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Others' ratings */}
            {ratings.filter((r) => r.user_id !== user?.id).length > 0 && (
              <div className="mt-2 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800">
                {ratings
                  .filter((r) => r.user_id !== user?.id)
                  .map((r) => {
                    const member = members.find((m) => m.user_id === r.user_id);
                    const name = member?.profile.display_name ?? 'Member';
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 text-xs text-slate-400">{name}</span>
                        <RatingStars value={r.stars} readonly size="sm" />
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        {householdId && user && (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-white">
              <StickyNote className="h-4 w-4 text-slate-400" />
              Notes
            </h2>

            {/* My note editor */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-slate-400">Your note</p>
              <textarea
                value={noteText ?? (myNote?.content ?? '')}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a personal note about this recipe…"
                maxLength={500}
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-700">
                  {(noteText ?? myNote?.content ?? '').length}/500
                </span>
                <div className="flex items-center gap-2">
                  {myNote && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteNote.mutate({ noteId: myNote.id, recipeId: id!, householdId });
                        setNoteText('');
                      }}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const content = (noteText ?? '').trim();
                      if (!content || !id) return;
                      upsertNote.mutate({ recipeId: id, householdId, content });
                      setNoteText(null);
                    }}
                    disabled={upsertNote.isPending || !(noteText ?? '').trim()}
                    className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/30 disabled:opacity-40"
                  >
                    {upsertNote.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Other members' notes */}
            {notes.filter((n) => n.user_id !== user?.id).length > 0 && (
              <div className="mt-2 flex flex-col divide-y divide-slate-800 rounded-xl border border-slate-800">
                {notes
                  .filter((n) => n.user_id !== user?.id)
                  .map((n) => (
                    <div key={n.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                          {n.display_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{n.display_name}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300">{n.content}</p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* Source badge */}
        <div className="mt-8 text-xs text-slate-600">
          {recipe.is_global ? '🌐 Global recipe' : '🏠 Household recipe'}
        </div>
      </div>
    </div>
  );
}
