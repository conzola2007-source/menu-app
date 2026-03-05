'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, UserPlus, LogIn, ChevronDown, Check, X, PlusCircle } from 'lucide-react';
import { useHousehold, useHouseholds } from '@/hooks/useHousehold';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuthStore } from '@/stores/authStore';
import { useRemoveMember } from '@/hooks/useJoinRequests';
import { InviteCodeDisplay } from '@/components/household/InviteCodeDisplay';
import { MemberList } from '@/components/household/MemberList';
import { MemberRecipes } from '@/components/household/MemberRecipes';
import { IngredientList } from '@/components/household/IngredientList';
import { VisitInviteSheet } from '@/components/household/VisitInviteSheet';

type Tab = 'analytics' | 'household' | 'ingredients' | 'recipes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'household', label: 'Household' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'recipes', label: 'Recipes' },
];

export default function HouseholdPage() {
  const router = useRouter();
  const { data: membership, isLoading } = useHousehold();
  const { data: allHouseholds = [] } = useHouseholds();
  const { data: recipes = [] } = useRecipes();
  const user = useAuthStore((s) => s.user);
  const setActiveHousehold = useAuthStore((s) => s.setActiveHousehold);
  const removeMember = useRemoveMember();
  const [activeTab, setActiveTab] = useState<Tab>('household');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showVisitInvite, setShowVisitInvite] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  function handleKickMember(targetUserId: string) {
    if (!membership) return;
    setKickingUserId(targetUserId);
    removeMember.mutate(
      { targetUserId, householdId: membership.household.id },
      { onSettled: () => setKickingUserId(null) },
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-48 rounded-xl bg-slate-800" />
          <div className="h-10 rounded-2xl bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  // ── No household ─────────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSwitcher(true)}
            className="flex items-center gap-1.5 text-lg font-bold text-white"
          >
            {membership.household.name}
            {allHouseholds.length > 1 && (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          <Link
            href="/household/settings"
            className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Tab island */}
      <div className="px-4 pt-4">
        <div className="flex rounded-2xl bg-slate-800 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-4 px-4 pt-4">

        {/* ── Analytics ───────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl">📊</span>
            <p className="mt-3 font-medium text-white">Analytics coming soon</p>
            <p className="mt-1 text-sm text-slate-500">Meal history, top recipes, and more.</p>
          </div>
        )}

        {/* ── Household ───────────────────────────────────────────────────── */}
        {activeTab === 'household' && (
          <>
            {/* Members */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Members · {membership.members.length}
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
                <MemberList
                  members={membership.members}
                  currentUserId={user?.id ?? null}
                  onMemberClick={(uid) => setSelectedUserId(uid)}
                  isCurrentUserOwner={membership.role === 'owner'}
                  onKickMember={membership.role === 'owner' ? handleKickMember : undefined}
                  kickingUserId={kickingUserId}
                />
              </div>
            </section>

            {/* Invite */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invite
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <InviteCodeDisplay code={membership.household.invite_code} />
                <button
                  type="button"
                  onClick={() => setShowVisitInvite(true)}
                  className="mt-3 text-sm text-slate-400 hover:text-white"
                >
                  + Invite as visitor
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── Ingredients ─────────────────────────────────────────────────── */}
        {activeTab === 'ingredients' && (
          <IngredientList householdId={membership.household.id} />
        )}

        {/* ── Recipes ─────────────────────────────────────────────────────── */}
        {activeTab === 'recipes' && (
          recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl">🍽️</span>
              <p className="mt-3 font-medium text-white">No recipes yet</p>
              <Link
                href="/recipes/new"
                className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Add a recipe
              </Link>
            </div>
          ) : (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recipes · {recipes.length}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {recipes.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipes/${r.id}`}
                    className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: r.bg_color }}
                    >
                      {r.emoji}
                    </span>
                    <span className="flex-1 truncate text-xs font-medium text-white">
                      {r.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}
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

      {/* Visit invite sheet */}
      {showVisitInvite && (
        <VisitInviteSheet
          inviteCode={membership.household.invite_code}
          onClose={() => setShowVisitInvite(false)}
        />
      )}

      {/* Household switcher sheet */}
      <AnimatePresence>
        {showSwitcher && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSwitcher(false)}
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => { if (info.offset.y > 100) setShowSwitcher(false); }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl"
            >
              <div className="flex cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
                <div className="h-1 w-10 rounded-full bg-slate-600" />
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <p className="text-sm font-semibold text-white">Your households</p>
                <button
                  type="button"
                  onClick={() => setShowSwitcher(false)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col pb-10">
                {allHouseholds.map((h) => {
                  const isActive = h.household.id === membership.household.id;
                  return (
                    <button
                      key={h.household.id}
                      type="button"
                      onClick={() => {
                        setActiveHousehold(h.household.id);
                        setShowSwitcher(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-lg">
                        🏠
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{h.household.name}</p>
                        <p className="text-xs text-slate-500">{h.members.length} member{h.members.length !== 1 ? 's' : ''}</p>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setShowSwitcher(false);
                    router.push('/household/join');
                  }}
                  className="flex items-center gap-3 border-t border-slate-800 px-4 py-3.5 text-left hover:bg-slate-800"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-800">
                    <PlusCircle className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-sm font-medium text-slate-400">Join another household</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
