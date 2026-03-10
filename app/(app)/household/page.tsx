'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, UserPlus, LogIn, ChevronDown, Check, PlusCircle, Bell } from 'lucide-react';
import { useHousehold, useHouseholds } from '@/hooks/useHousehold';
import { useHouseholdPool } from '@/hooks/useRecipes';
import { useAuthStore } from '@/stores/authStore';
import { useRemoveMember } from '@/hooks/useJoinRequests';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import { useMySuggestions, useSubmitSuggestion } from '@/hooks/useSuggestions';
import { useHouseholdAnalytics } from '@/hooks/useMealHistory';
import { useShoppingStats } from '@/hooks/useShoppingStats';
import { InviteCodeDisplay } from '@/components/household/InviteCodeDisplay';
import { MemberList } from '@/components/household/MemberList';
import { MemberRecipes } from '@/components/household/MemberRecipes';
import { IngredientList } from '@/components/household/IngredientList';
import { VisitInviteSheet } from '@/components/household/VisitInviteSheet';
import { Sheet } from '@/components/ui/Sheet';
import { isHead } from '@/lib/roles';

type Tab = 'analytics' | 'household' | 'ingredients' | 'recipes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics',   label: 'Analytics' },
  { id: 'household',   label: 'Household' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'recipes',     label: 'Recipes' },
];

export default function HouseholdPage() {
  const router = useRouter();
  const { data: membership, isLoading } = useHousehold();
  const { data: allHouseholds = [] }    = useHouseholds();
  const { data: poolRecipes = [] }      = useHouseholdPool(membership?.household.id ?? null);
  const user               = useAuthStore((s) => s.user);
  const setActiveHousehold = useAuthStore((s) => s.setActiveHousehold);
  const removeMember       = useRemoveMember();

  const currentUserIsHead = membership ? isHead(membership.role) : false;

  // Bell badge counts (only fetched for heads)
  const { data: joinRequests = [] } = useJoinRequests(
    currentUserIsHead ? membership?.household.id : undefined,
  );
  const { data: mySuggestions = [] } = useMySuggestions(
    membership?.household.id,
    user?.id,
  );
  const submitSuggestion = useSubmitSuggestion();

  const [activeTab,        setActiveTab]        = useState<Tab>('household');
  const [selectedUserId,   setSelectedUserId]   = useState<string | null>(null);
  const [showVisitInvite,  setShowVisitInvite]  = useState(false);
  const [showSwitcher,     setShowSwitcher]     = useState(false);
  const [kickingUserId,    setKickingUserId]    = useState<string | null>(null);
  const [suggestionText,   setSuggestionText]   = useState('');
  const [suggestionSent,   setSuggestionSent]   = useState(false);

  const { data: analytics } = useHouseholdAnalytics(membership?.household.id ?? null);
  const { data: shoppingStats } = useShoppingStats(membership?.household.id);

  const bellCount = currentUserIsHead ? joinRequests.length : 0;

  function handleKickMember(targetUserId: string) {
    if (!membership) return;
    setKickingUserId(targetUserId);
    removeMember.mutate(
      { targetUserId, householdId: membership.household.id },
      { onSettled: () => setKickingUserId(null) },
    );
  }

  async function handleSubmitSuggestion() {
    if (!membership || !suggestionText.trim()) return;
    await submitSuggestion.mutateAsync({
      householdId: membership.household.id,
      content: suggestionText.trim(),
    });
    setSuggestionText('');
    setSuggestionSent(true);
    setTimeout(() => setSuggestionSent(false), 3000);
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

  // ── No household ───────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-2">
            {/* Bell — heads only */}
            {currentUserIsHead && (
              <Link
                href="/household/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {bellCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
            )}
            <Link
              href="/household/settings"
              className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
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
          <div className="flex flex-col gap-4">
            {/* Total meals stat */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
              <span className="text-sm text-slate-400">Total meals cooked</span>
              <span className="text-lg font-bold text-white">
                {analytics?.total_meals ?? 0}
              </span>
            </div>

            {/* Top recipes */}
            {analytics?.top_recipes && analytics.top_recipes.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Most cooked
                </p>
                <div className="flex flex-col divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
                  {analytics.top_recipes.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/recipes/${r.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-600 w-4">#{i + 1}</span>
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
                        style={{ backgroundColor: r.bg_color }}
                      >
                        {r.emoji}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-white">
                        {r.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.avg_stars != null && (
                          <span className="text-xs text-amber-400">{r.avg_stars.toFixed(1)} ★</span>
                        )}
                        <span className="text-xs text-slate-500">×{r.cook_count}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Top chefs */}
            {analytics?.top_chefs && analytics.top_chefs.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chef leaderboard
                </p>
                <div className="flex flex-col divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
                  {analytics.top_chefs.map((chef, i) => (
                    <div key={chef.user_id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xs font-bold text-slate-600 w-4">#{i + 1}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                        {chef.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 text-sm font-medium text-white">
                        {chef.display_name}
                      </span>
                      <span className="text-xs text-slate-500">{chef.meals_cooked} meals</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Shopping stats */}
            {shoppingStats && shoppingStats.total_trips > 0 && (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shopping trips
                </p>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 mb-2">
                  <span className="text-sm text-slate-400">Total trips logged</span>
                  <span className="text-lg font-bold text-white">{shoppingStats.total_trips}</span>
                </div>
                {shoppingStats.shoppers.length > 0 && (
                  <div className="flex flex-col divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
                    {shoppingStats.shoppers.map((s, i) => (
                      <div key={s.user_id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xs font-bold text-slate-600 w-4">#{i + 1}</span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                          {s.display_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 text-sm font-medium text-white">{s.display_name}</span>
                        <span className="text-xs text-slate-500">{s.trip_count} trip{s.trip_count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Empty state */}
            {(!analytics || analytics.total_meals === 0) && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl">📊</span>
                <p className="mt-3 font-medium text-white">No data yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Finalize meal plans to see your cooking stats.
                </p>
              </div>
            )}

            {/* Link to full history */}
            {analytics && analytics.total_meals > 0 && (
              <Link
                href="/history"
                className="rounded-full border border-slate-700 py-2 text-center text-sm text-slate-400 hover:text-white transition-colors"
              >
                View full meal history →
              </Link>
            )}
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
                  isCurrentUserHead={currentUserIsHead}
                  onKickMember={currentUserIsHead ? handleKickMember : undefined}
                  kickingUserId={kickingUserId}
                />
              </div>
            </section>

            {/* Invite — only heads can see invite section */}
            {currentUserIsHead && (
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
            )}

            {/* Suggestions */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggest a meal idea
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmitSuggestion(); }}
                    placeholder="e.g. Tacos on Friday!"
                    maxLength={200}
                    className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSubmitSuggestion()}
                    disabled={!suggestionText.trim() || submitSuggestion.isPending}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {submitSuggestion.isPending ? '…' : 'Send'}
                  </button>
                </div>
                {suggestionSent && (
                  <p className="mt-2 text-xs text-green-400">Suggestion sent!</p>
                )}
                {/* Own suggestions history */}
                {mySuggestions.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {mySuggestions.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2">
                        <p className="flex-1 truncate text-xs text-slate-400">{s.content}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          s.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          s.status === 'denied'   ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
          poolRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl">🍽️</span>
              <p className="mt-3 font-medium text-white">No recipes yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Members&apos; saved recipes will appear here.
              </p>
            </div>
          ) : (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                All household recipes · {poolRecipes.length}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {poolRecipes.map((r) => (
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

      {/* ── Member recipes sheet ─────────────────────────────────────────────── */}
      <MemberRecipes
        isOpen={!!(selectedMember && user)}
        member={
          selectedMember && user
            ? {
                user_id:   selectedMember.user_id,
                name:      selectedMember.profile.display_name,
                avatarUrl: selectedMember.profile.avatar_url,
              }
            : null
        }
        currentUserId={user?.id ?? ''}
        householdId={membership.household.id}
        onClose={() => setSelectedUserId(null)}
      />

      {/* ── Visit invite sheet ───────────────────────────────────────────────── */}
      <VisitInviteSheet
        isOpen={showVisitInvite}
        inviteCode={membership.household.invite_code}
        onClose={() => setShowVisitInvite(false)}
      />

      {/* ── Household switcher sheet ─────────────────────────────────────────── */}
      <Sheet
        isOpen={showSwitcher}
        onClose={() => setShowSwitcher(false)}
        title="Your households"
      >
        <div className="flex flex-col pb-4">
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
                  <p className="text-xs text-slate-500">
                    {h.members.length} member{h.members.length !== 1 ? 's' : ''}
                  </p>
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
      </Sheet>
    </div>
  );
}
