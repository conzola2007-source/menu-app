'use client';

import Link from 'next/link';
import { Calendar, Star, RotateCcw } from 'lucide-react';
import { Avatar } from '@/components/household/MemberList';
import type { VoteRecipe, MemberVoteStatus } from '@/hooks/useVotes';
import type { VoteType } from '@/lib/supabase/types';

interface VoteResultsProps {
  recipes: VoteRecipe[];
  myVotes: Record<string, VoteType>;
  allVotes: { user_id: string; recipe_id: string; vote: VoteType }[];
  memberStatuses: MemberVoteStatus[];
  totalMembers: number;
  allMembersFinished: boolean;
}

export function VoteResults({
  recipes,
  myVotes,
  allVotes,
  memberStatuses,
  totalMembers,
  allMembersFinished,
}: VoteResultsProps) {
  // Build a map so we can look up display_name by user_id
  const memberMap = Object.fromEntries(memberStatuses.map((m) => [m.user_id, m]));

  // Aggregate votes per recipe, attach per-voter info, sort most → least
  const ranked = recipes
    .map((recipe) => {
      const votes = allVotes.filter((v) => v.recipe_id === recipe.id);
      const superVoters = votes
        .filter((v) => v.vote === 'super')
        .map((v) => memberMap[v.user_id])
        .filter(Boolean);
      const yesVoters = votes
        .filter((v) => v.vote === 'yes')
        .map((v) => memberMap[v.user_id])
        .filter(Boolean);
      const score = superVoters.length * 2 + yesVoters.length;
      return { recipe, superVoters, yesVoters, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.superVoters.length !== a.superVoters.length)
        return b.superVoters.length - a.superVoters.length;
      return b.score - a.score;
    });

  const waitingCount = memberStatuses.filter((m) => !m.hasFinished).length;

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="text-xl font-bold text-white">You&apos;ve voted on everything!</h2>
        {allMembersFinished ? (
          <p className="text-sm text-green-400">
            All {totalMembers} member{totalMembers !== 1 ? 's' : ''} have voted — ready to plan!
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Waiting on {waitingCount} more member{waitingCount !== 1 ? 's' : ''}…
          </p>
        )}
      </div>

      {/* ── CTAs ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {allMembersFinished && (
          <Link
            href="/plan"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30"
          >
            <Calendar className="h-4 w-4" />
            Allocate to week →
          </Link>
        )}
        <Link
          href="/vote?mode=revote"
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Re-vote
        </Link>
      </div>

      {/* ── Recipe grid ────────────────────────────────────────────────────── */}
      {ranked.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {ranked.map(({ recipe, superVoters, yesVoters }, index) => {
            const myVote = myVotes[recipe.id];
            const isTop = index === 0;

            return (
              <div
                key={recipe.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border ${
                  isTop ? 'border-primary/50' : 'border-slate-700'
                }`}
                style={{ backgroundColor: recipe.bg_color + '22' }}
              >
                {/* Rank badge */}
                <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white">
                  {index + 1}
                </div>

                {/* My vote badge */}
                {myVote && (
                  <div className="absolute right-2 top-2">
                    {myVote === 'super' ? (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-2.5 w-2.5 fill-white" /> me
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-500/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        👍 me
                      </span>
                    )}
                  </div>
                )}

                {/* Emoji hero */}
                <div
                  className="flex items-center justify-center py-6 text-5xl"
                  style={{ backgroundColor: recipe.bg_color + '55' }}
                >
                  {recipe.emoji}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  <p className="text-sm font-semibold leading-tight text-white line-clamp-2">
                    {recipe.title}
                  </p>

                  {/* Vote counts */}
                  <div className="flex items-center gap-1.5">
                    {superVoters.length > 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        <Star className="h-2.5 w-2.5 fill-amber-400" />
                        {superVoters.length}
                      </span>
                    )}
                    {yesVoters.length > 0 && (
                      <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                        👍 {yesVoters.length}
                      </span>
                    )}
                  </div>

                  {/* Voter avatars */}
                  {(superVoters.length > 0 || yesVoters.length > 0) && (
                    <div className="flex flex-wrap gap-1">
                      {[...superVoters, ...yesVoters].map((member) => (
                        <div key={member.user_id} title={member.display_name}>
                          <Avatar name={member.display_name} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-4xl">🤔</span>
          <p className="text-sm text-slate-400">
            Nobody voted yes on any recipes yet.
          </p>
        </div>
      )}
    </div>
  );
}
