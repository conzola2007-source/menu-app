'use client';

import Link from 'next/link';
import { CheckCircle2, Clock2, Calendar, Star, ThumbsUp } from 'lucide-react';
import { Avatar } from '@/components/household/MemberList';
import { CUISINE_LABELS } from '@/lib/recipe-constants';
import type { VoteRecipe, MemberVoteStatus } from '@/hooks/useVotes';
import type { VoteType, CuisineType } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoteResultsProps {
  recipes: VoteRecipe[];
  myVotes: Record<string, VoteType>;
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[];
  memberStatuses: MemberVoteStatus[];
  totalMembers: number;
  allMembersFinished: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VoteResults({
  recipes,
  myVotes,
  allVotes,
  memberStatuses,
  totalMembers,
  allMembersFinished,
}: VoteResultsProps) {
  // ── Aggregate votes per recipe ─────────────────────────────────────────────
  const aggregated = recipes
    .map((recipe) => {
      const votes = allVotes.filter((v) => v.recipe_id === recipe.id);
      const superCount = votes.filter((v) => v.vote === 'super').length;
      const yesCount = votes.filter((v) => v.vote === 'yes').length;
      const positiveCount = superCount + yesCount;
      const isShortlisted = totalMembers > 0 && positiveCount / totalMembers >= 0.5;
      const myVote = myVotes[recipe.id];
      return { recipe, superCount, yesCount, positiveCount, isShortlisted, myVote };
    })
    .filter((r) => r.positiveCount > 0)
    .sort((a, b) => {
      // Sort: super desc → positive total desc
      if (b.superCount !== a.superCount) return b.superCount - a.superCount;
      return b.positiveCount - a.positiveCount;
    });

  // ── My shortlist (yes or super) ────────────────────────────────────────────
  const myShortlist = recipes.filter(
    (r) => myVotes[r.id] === 'yes' || myVotes[r.id] === 'super',
  );

  const waitingOn = memberStatuses.filter((m) => !m.hasFinished);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="text-xl font-bold text-white">You&apos;ve voted on everything!</h2>

        {allMembersFinished ? (
          <p className="text-sm text-green-400">
            All {totalMembers} member{totalMembers !== 1 ? 's' : ''} have voted — ready to plan!
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Waiting on {waitingOn.length} more member
            {waitingOn.length !== 1 ? 's' : ''}…
          </p>
        )}
      </div>

      {/* ── Allocate CTA (shown once all members done) ──────────────────────── */}
      {allMembersFinished && (
        <Link
          href="/plan"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          <Calendar className="h-4 w-4" />
          Allocate to week →
        </Link>
      )}

      {/* ── Member status ───────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Member Status
        </h3>
        <ul className="flex flex-col gap-2">
          {memberStatuses.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
            >
              <Avatar name={m.display_name} size="sm" />
              <span className="flex-1 text-sm text-white">{m.display_name}</span>
              {m.hasFinished ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Done
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock2 className="h-3.5 w-3.5" />
                  {m.votedCount} / {recipes.length}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Top picks (aggregated across all members) ───────────────────────── */}
      {aggregated.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top Picks
          </h3>
          <ul className="flex flex-col gap-2">
            {aggregated.map(({ recipe, superCount, yesCount, isShortlisted, myVote }) => (
              <li
                key={recipe.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                  isShortlisted
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {/* Emoji + colour */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: recipe.bg_color }}
                >
                  {recipe.emoji}
                </div>

                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-white">
                      {recipe.title}
                    </span>
                    {isShortlisted && (
                      <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                        Shortlisted
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {CUISINE_LABELS[recipe.cuisine as CuisineType] ?? recipe.cuisine}
                  </span>
                </div>

                {/* Vote counts */}
                <div className="flex shrink-0 items-center gap-2">
                  {superCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {superCount}
                    </span>
                  )}
                  {yesCount > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full bg-green-500/20 px-1.5 py-0.5 text-xs font-medium text-green-400">
                      <ThumbsUp className="h-3 w-3" />
                      {yesCount}
                    </span>
                  )}
                </div>

                {/* My vote badge */}
                {myVote && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
                      myVote === 'super'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {myVote === 'super' ? '⭐ me' : '👍 me'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── My votes (quick reference) ───────────────────────────────────────── */}
      {myShortlist.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            My Yes Votes ({myShortlist.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {myShortlist.map((recipe) => (
              <span
                key={recipe.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300"
              >
                <span>{recipe.emoji}</span>
                <span>{recipe.title}</span>
                {myVotes[recipe.id] === 'super' && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {aggregated.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-4xl">🤔</span>
          <p className="text-sm text-slate-400">
            Nobody voted yes on any recipes yet. Try voting on some!
          </p>
        </div>
      )}
    </div>
  );
}
