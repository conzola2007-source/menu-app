'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThumbsUp, ThumbsDown, Star, RotateCcw } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useVoteData, useSubmitVote, useResetVotes, type VoteRecipe } from '@/hooks/useVotes';
import { SwipeCard, type SwipeCardHandle } from '@/components/vote/SwipeCard';
import { VoteResults } from '@/components/vote/VoteResults';
import type { VoteType } from '@/lib/supabase/types';

// ─── Card height (px) used to size the stack container ───────────────────────
const CARD_H = 400;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRevoteMode = searchParams.get('mode') === 'revote';

  const { data: membership, isLoading: householdLoading } = useHousehold();
  const { data: voteData, isLoading: voteLoading } = useVoteData();
  const submitVote = useSubmitVote();
  const resetVotes = useResetVotes();

  // Local queue: starts from unvoted recipes on first data load, then managed locally
  // (optimistic — we don't wait for the mutation to complete before showing next card)
  const [localQueue, setLocalQueue] = useState<VoteRecipe[] | null>(null);
  const topCardRef = useRef<SwipeCardHandle>(null);

  // Guards against the race where localQueue is still [] (from finishing the
  // original vote) when isRevoteMode first becomes true. The completion redirect
  // must only fire once the queue has been loaded WITH ITEMS, not on the brief
  // intermediate state before the mode-change reset applies.
  const revoteQueueWasLoaded = useRef(false);

  // Reset queue and tracking ref whenever mode changes so revote always starts fresh.
  useEffect(() => {
    setLocalQueue(null);
    revoteQueueWasLoaded.current = false;
  }, [isRevoteMode]);

  // Initialise queue from server data once it's been reset (or on first load)
  useEffect(() => {
    if (voteData && localQueue === null) {
      setLocalQueue(isRevoteMode ? voteData.recipes : voteData.unvotedRecipes);
    }
  }, [voteData, localQueue, isRevoteMode]);

  // Once the revote queue has actual items, mark the session active and set the flag.
  useEffect(() => {
    if (isRevoteMode && localQueue !== null && localQueue.length > 0) {
      revoteQueueWasLoaded.current = true;
      sessionStorage.setItem('revote_in_progress', 'true');
    }
  }, [isRevoteMode, localQueue]);

  // Restore revote session when user taps the Plan tab after switching away
  useEffect(() => {
    if (!isRevoteMode && sessionStorage.getItem('revote_in_progress') === 'true') {
      router.replace('/vote?mode=revote');
    }
  }, [isRevoteMode, router]);

  // Navigate to /plan only once the queue has been loaded AND then drained.
  // revoteQueueWasLoaded.current prevents firing when isRevoteMode just
  // became true and localQueue is still [] from the previous vote session.
  useEffect(() => {
    if (
      isRevoteMode &&
      localQueue !== null &&
      localQueue.length === 0 &&
      revoteQueueWasLoaded.current
    ) {
      sessionStorage.removeItem('revote_in_progress');
      router.replace('/plan');
    }
  }, [isRevoteMode, localQueue, router]);

  // Normal vote complete — go straight to plan.
  // localQueue starts as null (not yet loaded), so [] only means genuinely empty.
  useEffect(() => {
    if (!isRevoteMode && localQueue !== null && localQueue.length === 0) {
      router.replace('/plan');
    }
  }, [isRevoteMode, localQueue, router]);

  const isLoading = householdLoading || voteLoading;

  // ── Handle a vote ──────────────────────────────────────────────────────────
  function handleVote(recipeId: string, vote: VoteType) {
    submitVote.mutate({ recipeId, vote });
    setLocalQueue((prev) => (prev ? prev.filter((r) => r.id !== recipeId) : []));
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded-xl bg-slate-800" />
          <div className="rounded-3xl bg-slate-800" style={{ height: CARD_H }} />
          <div className="mx-auto h-14 w-3/4 rounded-full bg-slate-800" />
        </div>
      </div>
    );
  }

  // ── No household ──────────────────────────────────────────────────────────
  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
        <Link
          href="/household/create"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create household
        </Link>
      </div>
    );
  }

  // ── No recipes ────────────────────────────────────────────────────────────
  if (!voteData || voteData.recipes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
        <div className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-lg font-bold text-white">Vote</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-5xl">🍽️</span>
          <p className="font-medium text-white">No recipes to vote on yet</p>
          <p className="text-sm text-slate-400">Add some household recipes to get started.</p>
          <Link
            href="/recipes/new"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Add a recipe
          </Link>
        </div>
      </div>
    );
  }

  const queue = localQueue ?? voteData.unvotedRecipes;
  const doneCount = voteData.recipes.length - queue.length;
  const totalCount = voteData.recipes.length;
  // Only true once localQueue has been explicitly initialised AND emptied.
  // null means "not yet loaded" — we must not treat that as "all voted".
  const allVotedByMe = localQueue !== null && localQueue.length === 0;

  // ── Results view ──────────────────────────────────────────────────────────
  // Both modes redirect to /plan via useEffect — return null to avoid flash.
  if (allVotedByMe) {
    return null;
  }

  // ── Swipe view ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 pb-3 pt-safe">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">
            {isRevoteMode ? 'Re-vote' : 'Vote'}
          </h1>
          <div className="flex items-center gap-3">
            {isRevoteMode && (
              <button
                type="button"
                onClick={() => {
                  resetVotes.mutate(undefined, {
                    onSuccess: () => setLocalQueue(voteData?.recipes ?? []),
                  });
                }}
                disabled={resetVotes.isPending}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </button>
            )}
            <span className="text-xs text-slate-500">
              {doneCount} / {totalCount} voted
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-6">
        <div
          className="relative w-full max-w-sm"
          style={{ height: CARD_H }}
        >
          {queue.slice(0, 3).map((recipe, index) => (
            <SwipeCard
              key={recipe.id}
              ref={index === 0 ? topCardRef : null}
              recipe={recipe}
              position={index}
              onVote={handleVote}
              isActive={index === 0}
              currentVote={isRevoteMode && index === 0 ? voteData?.myVotes[recipe.id] : undefined}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex items-center justify-center gap-5">
          {/* No */}
          <button
            type="button"
            onClick={() => topCardRef.current?.triggerVote('no')}
            aria-label="Nope"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500/50 bg-slate-800 text-red-400 shadow-lg transition-all hover:border-red-500 hover:bg-red-500/10 active:scale-95"
          >
            <ThumbsDown className="h-6 w-6" />
          </button>

          {/* Super */}
          <button
            type="button"
            onClick={() => topCardRef.current?.triggerVote('super')}
            aria-label="Super vote"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/50 bg-slate-800 text-amber-400 shadow-lg transition-all hover:border-amber-500 hover:bg-amber-500/10 active:scale-95"
          >
            <Star className="h-5 w-5" />
          </button>

          {/* Yes */}
          <button
            type="button"
            onClick={() => topCardRef.current?.triggerVote('yes')}
            aria-label="Like"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-500/50 bg-slate-800 text-green-400 shadow-lg transition-all hover:border-green-500 hover:bg-green-500/10 active:scale-95"
          >
            <ThumbsUp className="h-6 w-6" />
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-4 text-xs text-slate-700">
          ← No · ↑ Super · → Yes
        </p>
      </div>

      {/* Member status footer */}
      {voteData.memberStatuses.length > 1 && (
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="mb-2 text-xs text-slate-600">
            {voteData.memberStatuses.filter((m) => m.hasFinished).length} of{' '}
            {voteData.totalMembers} members finished voting
          </p>
          <div className="flex flex-wrap gap-2">
            {voteData.memberStatuses.map((m) => (
              <span
                key={m.user_id}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  m.hasFinished
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {m.display_name.split(' ')[0]}
                {m.hasFinished ? ' ✓' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
