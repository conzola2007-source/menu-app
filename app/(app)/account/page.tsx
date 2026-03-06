'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Check, X, LogOut, ChefHat, Plus, KeyRound, Mail, Bell } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { AvatarUpload } from '@/components/account/AvatarUpload';
import { useJoinRequests, useAcceptJoinRequest, useDenyJoinRequest } from '@/hooks/useJoinRequests';
import { useMyRecipeCookRequests, useApproveRecipeCookRequest, useDenyRecipeCookRequest } from '@/hooks/useRecipeCookRequests';
import { Avatar } from '@/components/household/MemberList';
import {
  isPushSupported,
  usePushSubscription,
  useEnablePush,
  useDisablePush,
} from '@/hooks/usePushSubscription';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';

// ─── My recipes mini-list ─────────────────────────────────────────────────────

function MyRecipes({ userId }: { userId: string }) {
  const { data: recipes, isLoading } = useQuery({
    queryKey: ['my-recipes', userId],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, emoji, bg_color, cuisine')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-800" />
        ))}
      </div>
    );
  }

  if (!recipes?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
        <ChefHat className="mx-auto mb-2 h-8 w-8 text-slate-600" />
        <p className="text-sm text-slate-500">No recipes yet</p>
        <Link
          href="/recipes/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Add your first recipe
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {recipes.map((r) => (
        <Link
          key={r.id}
          href={`/recipes/${r.id}`}
          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 hover:border-slate-700"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: r.bg_color }}
          >
            {r.emoji}
          </div>
          <span className="flex-1 truncate text-sm font-medium text-white">{r.title}</span>
          <span className="shrink-0 text-xs capitalize text-slate-500">{r.cuisine}</span>
        </Link>
      ))}
      <Link
        href="/recipes"
        className="mt-1 text-center text-xs text-slate-500 hover:text-slate-300"
      >
        View all recipes →
      </Link>
    </div>
  );
}

// ─── Join requests section (owner only) ───────────────────────────────────────

function JoinRequestsSection({ householdId }: { householdId: string }) {
  const { data: requests = [], isLoading } = useJoinRequests(householdId);
  const accept = useAcceptJoinRequest();
  const deny = useDenyJoinRequest();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (isLoading || requests.length === 0) return null;

  async function handleAccept(requestId: string) {
    setProcessingId(requestId);
    try { await accept.mutateAsync({ requestId, assignRole: 'member' }); } finally { setProcessingId(null); }
  }

  async function handleDeny(requestId: string) {
    setProcessingId(requestId);
    try { await deny.mutateAsync(requestId); } finally { setProcessingId(null); }
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-400" />
        <p className="text-sm font-semibold text-amber-300">
          Join requests · {requests.length}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {requests.map((req) => {
          const name = req.profile?.display_name ?? 'Someone';
          const isProcessing = processingId === req.id;
          return (
            <div key={req.id} className="flex items-center gap-3">
              <Avatar name={name} avatarUrl={req.profile?.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="text-xs text-slate-500">wants to join your household</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleAccept(req.id)}
                  disabled={isProcessing}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeny(req.id)}
                  disabled={isProcessing}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Recipe cook request inbox ─────────────────────────────────────────────────

function RecipeCookRequestsSection({ userId }: { userId: string }) {
  const { data: requests = [], isLoading } = useMyRecipeCookRequests(userId);
  const approve = useApproveRecipeCookRequest();
  const deny = useDenyRecipeCookRequest();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (isLoading || requests.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ChefHat className="h-4 w-4 text-violet-400" />
        <p className="text-sm font-semibold text-violet-300">
          Recipe requests · {requests.length}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {requests.map((req) => {
          const requesterName = req.requester_profile?.display_name ?? 'Someone';
          const isProcessing = processingId === req.id;
          return (
            <div key={req.id} className="flex items-center gap-3">
              <Avatar name={requesterName} avatarUrl={req.requester_profile?.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{requesterName}</p>
                <p className="truncate text-xs text-slate-500">
                  wants a copy of {req.recipe?.emoji} {req.recipe?.title}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProcessingId(req.id);
                    approve.mutate(
                      { requestId: req.id, recipeId: req.recipe_id, requesterId: req.requester_id, ownerId: req.owner_id },
                      { onSettled: () => setProcessingId(null) },
                    );
                  }}
                  disabled={isProcessing}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProcessingId(req.id);
                    deny.mutate(
                      { requestId: req.id, ownerId: req.owner_id },
                      { onSettled: () => setProcessingId(null) },
                    );
                  }}
                  disabled={isProcessing}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Notification preferences section ─────────────────────────────────────────

function NotificationsSection({ userId }: { userId: string }) {
  const { data: subscription, isLoading: subLoading } = usePushSubscription();
  const enablePush = useEnablePush();
  const disablePush = useDisablePush();
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const isSubscribed = !!subscription;
  const pushSupported = isPushSupported();

  if (!pushSupported) return null;

  type PrefKey = 'plan_finalized' | 'cooking_reminder' | 'advance_prep_reminder' | 'join_request' | 'recipe_add_request';
  const prefToggles: { key: PrefKey; label: string }[] = [
    { key: 'plan_finalized', label: 'Week plan finalised' },
    { key: 'cooking_reminder', label: 'Cooking reminder' },
    { key: 'advance_prep_reminder', label: 'Advance prep reminder' },
    { key: 'join_request', label: 'New join requests' },
    { key: 'recipe_add_request', label: 'Recipe add requests' },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notifications</p>
      </div>

      {/* Master push toggle */}
      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm text-slate-300">Push notifications</p>
          {subLoading ? null : isSubscribed ? (
            <p className="text-xs text-green-400">Enabled on this device</p>
          ) : (
            <p className="text-xs text-slate-500">Disabled</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (isSubscribed) {
              void disablePush.mutate();
            } else {
              void enablePush.mutate();
            }
          }}
          disabled={enablePush.isPending || disablePush.isPending || subLoading}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
            isSubscribed ? 'bg-primary' : 'bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isSubscribed ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Per-type toggles (only shown when subscribed) */}
      {isSubscribed && prefs && (
        <>
          {prefToggles.map(({ key, label }) => {
            const enabled = (prefs as Record<string, unknown>)[key] !== false;
            return (
              <div
                key={key}
                className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <button
                  type="button"
                  onClick={() => void updatePrefs.mutate({ [key]: !enabled })}
                  disabled={updatePrefs.isPending}
                  className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
                    enabled ? 'bg-primary' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </>
      )}

      {enablePush.isError && (
        <p className="border-t border-slate-800 px-4 py-2 text-xs text-red-400">
          {enablePush.error instanceof Error ? enablePush.error.message : 'Failed to enable notifications'}
        </p>
      )}
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeHouseholdId = useAuthStore((s) => s.activeHouseholdId);
  const { signOut } = useAuthStore();
  const { data: membership, isLoading } = useHousehold();
  const queryClient = useQueryClient();

  const myMemberAvatar = membership?.members.find((m) => m.user_id === user?.id)?.profile.avatar_url ?? null;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // null = use myMemberAvatar

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const displayName = membership?.members.find((m) => m.user_id === user?.id)?.profile.display_name ?? user?.email ?? 'You';

  // ── Name editing ─────────────────────────────────────────────────────────────
  function startEditName() {
    setNameValue(displayName);
    setNameError(null);
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === displayName) { setEditingName(false); return; }
    if (trimmed.length > 50) { setNameError('Max 50 characters'); return; }
    setNameLoading(true);
    setNameError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', user!.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current(activeHouseholdId) });
      setEditingName(false);
    } catch {
      setNameError('Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  }

  // ── Password change ──────────────────────────────────────────────────────────
  async function savePassword() {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg('Password updated!');
      setNewPassword('');
      setEditingPassword(false);
    } catch (err: unknown) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Sign out ─────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    signOut();
    router.push('/sign-in');
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <h1 className="text-lg font-bold text-white">Account</h1>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-6">

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 pb-2">
          {isLoading || !user ? (
            <div className="h-20 w-20 animate-pulse rounded-full bg-slate-700" />
          ) : (
            <AvatarUpload
              userId={user.id}
              displayName={displayName}
              currentAvatarUrl={avatarUrl ?? myMemberAvatar}
              onUploaded={(url) => {
                setAvatarUrl(url);
                void queryClient.invalidateQueries({ queryKey: queryKeys.household.current(activeHouseholdId) });
              }}
            />
          )}

          {editingName ? (
            <div className="flex w-full max-w-xs flex-col gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                maxLength={50}
                autoFocus
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-center text-base font-semibold text-white focus:border-primary focus:outline-none"
              />
              {nameError && <p className="text-center text-xs text-red-400">{nameError}</p>}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveName()}
                  disabled={nameLoading}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {nameLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-400"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">
                {isLoading ? '…' : displayName}
              </span>
              <button
                type="button"
                onClick={startEditName}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {user?.email && (
            <p className="text-sm text-slate-500">{user.email}</p>
          )}
        </div>

        {/* Join requests — owners only */}
        {membership?.role === 'owner' && membership.household.id && (
          <JoinRequestsSection householdId={membership.household.id} />
        )}

        {/* Recipe cook requests inbox */}
        {user && <RecipeCookRequestsSection userId={user.id} />}

        {/* Security */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
          </div>

          {/* Email (display only) */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-800">
            <Mail className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="flex-1 text-sm text-slate-300">{user?.email}</span>
          </div>

          {/* Password change */}
          <div className="border-t border-slate-800 px-4 py-3">
            {!editingPassword ? (
              <button
                type="button"
                onClick={() => { setEditingPassword(true); setPasswordMsg(null); }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                {passwordMsg && (
                  <p className={`text-xs ${passwordMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMsg}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void savePassword()}
                    disabled={passwordLoading}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {passwordLoading ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingPassword(false); setPasswordMsg(null); }}
                    className="rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        {user && <NotificationsSection userId={user.id} />}

        {/* My Recipes */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My Recipes</p>
            <Link
              href="/recipes/new"
              className="flex items-center gap-1 text-xs text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Link>
          </div>
          {user && <MyRecipes userId={user.id} />}
        </section>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400 hover:border-slate-600 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
