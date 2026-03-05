'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, UserPlus, LogIn } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { InviteCodeDisplay } from '@/components/household/InviteCodeDisplay';
import { MemberList } from '@/components/household/MemberList';
import { MemberRecipes } from '@/components/household/MemberRecipes';
import { IngredientList } from '@/components/household/IngredientList';

export default function HouseholdPage() {
  const { data: membership, isLoading } = useHousehold();
  const user = useAuthStore((s) => s.user);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-48 rounded-xl bg-slate-800" />
          <div className="h-32 rounded-2xl bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  // ── No household: show onboarding options ───────────────────────────────────
  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 px-6">
        <div className="text-center">
          <div className="mb-3 text-5xl">🏠</div>
          <h1 className="text-xl font-bold text-white">No household yet</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create your own or join one with an invite code.
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/household/create"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            <UserPlus className="h-4 w-4" />
            Create a household
          </Link>
          <Link
            href="/household/join"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Join with invite code
          </Link>
        </div>
      </div>
    );
  }

  const selectedMember = selectedUserId
    ? membership.members.find((m) => m.user_id === selectedUserId) ?? null
    : null;

  // ── In a household: show info + members ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">{membership.household.name}</h1>
          <Link
            href="/household/settings"
            className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {/* Invite code */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invite Code
          </p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <InviteCodeDisplay code={membership.household.invite_code} />
          </div>
        </section>

        {/* Members — tap to view their recipes */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Members · {membership.members.length}
          </p>
          <p className="mb-2 text-xs text-slate-600">Tap a member to see their recipes</p>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
            <MemberList
              members={membership.members}
              currentUserId={user?.id ?? null}
              onMemberClick={(uid) => setSelectedUserId(uid)}
            />
          </div>
        </section>

        {/* Ingredient library */}
        <IngredientList householdId={membership.household.id} />
      </div>

      {/* Member recipes sheet */}
      {selectedMember && user && (
        <MemberRecipes
          member={{
            user_id: selectedMember.user_id,
            name: selectedMember.profile.display_name,
            avatarUrl: selectedMember.profile.avatar_url,
          }}
          currentUserId={user.id}
          householdId={membership.household.id}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
