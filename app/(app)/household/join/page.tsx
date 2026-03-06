'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSendJoinRequest } from '@/hooks/useJoinRequests';
import { queryKeys } from '@/lib/queryKeys';

interface HouseholdPreview {
  id: string;
  name: string;
  memberCount: number;
}

/** Invite codes are exactly 6 uppercase alphanumeric characters. */
const INVITE_CODE_RE = /^[A-Z0-9]{6}$/;

export default function JoinHouseholdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setActiveHousehold = useAuthStore((s) => s.setActiveHousehold);
  const sendJoinRequest = useSendJoinRequest();

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const visitDays = parseInt(searchParams.get('visit') ?? '0', 10) || 0;
  const [preview, setPreview] = useState<HouseholdPreview | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [visitorJoined, setVisitorJoined] = useState(false);

  // Auto-lookup if code in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      lookupCode(urlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookupCode(inviteCode: string) {
    const normalised = inviteCode.toUpperCase().trim();

    if (!INVITE_CODE_RE.test(normalised)) {
      setLookupError('Invite codes are 6 characters (letters and numbers).');
      return;
    }

    setIsLooking(true);
    setLookupError('');
    setPreview(null);

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .rpc('find_household_by_invite_code', { code: normalised });

    if (error || !data || data.length === 0) {
      setLookupError('Invalid invite code. Ask your household owner for a new one.');
      setIsLooking(false);
      return;
    }

    const household = data[0] as { id: string; name: string; member_count: number };
    setPreview({ id: household.id, name: household.name, memberCount: household.member_count });
    setIsLooking(false);
  }

  async function handleJoin() {
    if (!preview) return;
    setIsJoining(true);
    setJoinError('');

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJoinError('You must be signed in to join a household.');
      setIsJoining(false);
      return;
    }

    // Check not already in THIS specific household
    const { data: existing } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('household_id', preview.id)
      .maybeSingle();

    if (existing) {
      setJoinError("You're already a member of this household.");
      setIsJoining(false);
      return;
    }

    // ── Visitor join — direct membership (owner already approved via link) ──
    if (visitDays > 0) {
      const visitExpiresAt = new Date(Date.now() + visitDays * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('household_members')
        .insert({
          household_id: preview.id,
          user_id: user.id,
          role: 'visitor',
          visitor_expires_at: visitExpiresAt,
        } as never);

      if (error) {
        console.error('[JoinHousehold] visitor insert error:', error);
        setJoinError('Failed to join household. Please try again.');
        setIsJoining(false);
        return;
      }

      setActiveHousehold(preview.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.current(preview.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.household.all() });
      // Show welcome screen instead of redirecting
      setVisitorJoined(true);
      setIsJoining(false);
      return;
    }

    // ── Regular join — submit a request, owner must approve ──
    try {
      await sendJoinRequest.mutateAsync({ householdId: preview.id });
      setRequestSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setJoinError("You've already requested to join this household. The owner hasn't approved yet.");
      } else {
        console.error('[JoinHousehold] request error:', err);
        setJoinError('Failed to send join request. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  }

  // ── Visitor welcome screen ───────────────────────────────────────────────────
  if (visitorJoined && preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-white">Welcome to {preview.name}!</h1>
          <p className="mt-2 text-sm text-slate-400">
            You&apos;ve joined as a visitor. Your access expires in {visitDays}{' '}
            {visitDays === 1 ? 'day' : 'days'}.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/recipes"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Add your recipes
            </Link>
            <Link
              href="/household"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-300"
            >
              Go to household
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Request sent confirmation screen ────────────────────────────────────────
  if (requestSent && preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">✉️</div>
          <h1 className="text-2xl font-bold text-white">Request sent!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your request to join <span className="font-medium text-white">{preview.name}</span> has been sent.
            The owner will be notified and can accept or deny your request.
          </p>
          <Link
            href="/vote"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🔑</div>
          <h1 className="text-2xl font-bold text-white">Join a household</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter the 6-character invite code
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Invite code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  placeholder="K7XM2P"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setPreview(null);
                    setLookupError('');
                  }}
                  className="font-mono tracking-widest uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  loading={isLooking}
                  disabled={code.length < 6}
                  onClick={() => lookupCode(code)}
                >
                  Find
                </Button>
              </div>
              {lookupError && (
                <p className="text-xs text-red-400">{lookupError}</p>
              )}
            </div>

            {preview && (
              <div className="rounded-xl border border-slate-600 bg-slate-900 p-4">
                <p className="font-semibold text-white">{preview.name}</p>
                <p className="mt-0.5 text-sm text-slate-400">
                  {preview.memberCount} member{preview.memberCount !== 1 ? 's' : ''}
                </p>
                {visitDays > 0 ? (
                  <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                    Visitor access — expires in {visitDays} {visitDays === 1 ? 'day' : 'days'}
                  </p>
                ) : (
                  <p className="mt-2 rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
                    The owner will need to approve your request
                  </p>
                )}
              </div>
            )}

            {joinError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {joinError}
              </p>
            )}

            <Button
              disabled={!preview}
              loading={isJoining}
              onClick={() => void handleJoin()}
              className="w-full"
            >
              {visitDays > 0 ? 'Join as visitor' : 'Send join request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
