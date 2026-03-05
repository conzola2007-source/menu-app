'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, LogOut } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/household/MemberList';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuthStore();
  const { data: membership, isLoading } = useHousehold();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Find current user's member entry to get their display name
  const myMember = membership?.members.find((m) => m.user_id === user?.id);
  const displayName = myMember?.profile.display_name ?? user?.email ?? 'You';

  function startEdit() {
    setNameValue(displayName);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === displayName) {
      setEditing(false);
      return;
    }
    if (trimmed.length > 50) {
      setSaveError('Name must be 50 characters or fewer.');
      return;
    }
    setSaveLoading(true);
    setSaveError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', user!.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
      setEditing(false);
    } catch {
      setSaveError('Failed to update name. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    signOut();
    router.push('/sign-in');
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/95 px-4 py-3">
        <h1 className="text-lg font-bold text-white">Profile</h1>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading ? (
            <div className="h-20 w-20 animate-pulse rounded-full bg-slate-700" />
          ) : (
            <Avatar name={displayName} size="lg" />
          )}

          {editing ? (
            <div className="flex w-full max-w-xs flex-col gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveName();
                  if (e.key === 'Escape') cancelEdit();
                }}
                maxLength={50}
                autoFocus
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-center text-base font-semibold text-white focus:border-primary focus:outline-none"
              />
              {saveError && <p className="text-center text-xs text-red-400">{saveError}</p>}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveName()}
                  disabled={saveLoading}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saveLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
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
                onClick={startEdit}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                aria-label="Edit display name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {user?.email && (
            <p className="text-sm text-slate-500">{user.email}</p>
          )}
        </div>

        {/* Household info */}
        {membership && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Household
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{membership.household.name}</span>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400 capitalize">
                {membership.role}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {membership.members.length} member{membership.members.length !== 1 ? 's' : ''}
            </p>
          </section>
        )}

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
