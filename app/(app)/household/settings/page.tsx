'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { InviteCodeDisplay } from '@/components/household/InviteCodeDisplay';
import { MemberList } from '@/components/household/MemberList';

// ─── Secure code generator ────────────────────────────────────────────────────

function generateSecureCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HouseholdSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuthStore();
  const { data: membership, isLoading } = useHousehold();
  const queryClient = useQueryClient();

  const [regenLoading, setRegenLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = membership?.role === 'owner';

  // ── Regenerate invite code (owner only) ──────────────────────────────────────
  async function handleRegenCode() {
    if (!membership || !isOwner) return;
    setRegenLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const newCode = generateSecureCode();
      const { error: err } = await supabase
        .from('households')
        .update({ invite_code: newCode })
        .eq('id', membership.household.id);
      if (err) throw err;
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
    } catch {
      setError('Failed to regenerate invite code. Please try again.');
    } finally {
      setRegenLoading(false);
    }
  }

  // ── Leave household (non-owner) ───────────────────────────────────────────────
  async function handleLeave() {
    if (!membership || isOwner || !user) return;
    setLeaveLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: err } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', membership.household.id)
        .eq('user_id', user.id);
      if (err) throw err;
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
      router.push('/household/create');
    } catch {
      setError('Failed to leave household. Please try again.');
    } finally {
      setLeaveLoading(false);
    }
  }

  // ── Delete household (owner only) ─────────────────────────────────────────────
  async function handleDelete() {
    if (!membership || !isOwner) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleteLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: err } = await supabase
        .from('households')
        .delete()
        .eq('id', membership.household.id);
      if (err) throw err;
      // Sign out and redirect
      await supabase.auth.signOut();
      signOut();
      router.push('/sign-in');
    } catch {
      setError('Failed to delete household. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/3 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-48 rounded-xl bg-slate-800" />
        </div>
      </div>
    );
  }

  // ── No household ──────────────────────────────────────────────────────────────
  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-4xl">🏠</span>
        <p className="text-white">You&apos;re not in a household yet.</p>
        <button
          type="button"
          onClick={() => router.push('/household/create')}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Create household
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Household Settings</h1>
            <p className="text-xs text-slate-500">{membership.household.name}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Invite code section */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invite Code
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <InviteCodeDisplay code={membership.household.invite_code} />
            {isOwner && (
              <button
                type="button"
                onClick={handleRegenCode}
                disabled={regenLoading}
                className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${regenLoading ? 'animate-spin' : ''}`} />
                {regenLoading ? 'Regenerating…' : 'Regenerate code'}
              </button>
            )}
          </div>
        </section>

        {/* Members section */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Members ({membership.members.length})
          </h2>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4">
            <MemberList members={membership.members} currentUserId={user?.id ?? null} />
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500/70">
            Danger Zone
          </h2>
          <div className="flex flex-col gap-2 rounded-2xl border border-red-500/20 bg-slate-900 p-4">
            {!isOwner ? (
              <>
                <p className="text-sm text-slate-400">
                  Leave this household. You can rejoin with an invite code.
                </p>
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={leaveLoading}
                  className="flex items-center gap-2 self-start rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:border-red-500/70 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {leaveLoading ? 'Leaving…' : 'Leave household'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  Permanently delete this household and all its data. This cannot be undone.
                </p>
                {confirmDelete ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-red-400">
                      Are you absolutely sure? This will delete all meal plans, votes, and recipes.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 self-start rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:border-red-500/70 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete household
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
