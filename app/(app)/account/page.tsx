'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Check, X, LogOut, ChefHat, Plus, KeyRound, Mail } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { AvatarUpload } from '@/components/account/AvatarUpload';

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
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
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
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
                void queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
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
