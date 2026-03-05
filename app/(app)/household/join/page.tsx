'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [preview, setPreview] = useState<HouseholdPreview | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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

    // Validate format client-side before hitting the database
    if (!INVITE_CODE_RE.test(normalised)) {
      setLookupError('Invite codes are 6 characters (letters and numbers).');
      return;
    }

    setIsLooking(true);
    setLookupError('');
    setPreview(null);

    const supabase = getSupabaseClient();

    // Use SECURITY DEFINER RPC so RLS doesn't block lookup for users not yet
    // in the household (direct SELECT on households would return nothing for them)
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

    // Re-verify the session on the client before writing
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJoinError('You must be signed in to join a household.');
      setIsJoining(false);
      return;
    }

    // Check not already in a household
    const { data: existing } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      setJoinError("You're already in a household. Leave your current household first.");
      setIsJoining(false);
      return;
    }

    // user_id is set from the authenticated session. The RLS policy on
    // household_members must enforce auth.uid() = user_id so the client
    // cannot spoof membership for another user.
    const { error } = await supabase
      .from('household_members')
      .insert({ household_id: preview.id, user_id: user.id, role: 'member' } as never);

    if (error) {
      // Log the real error server-side; show a safe message to the user
      console.error('[JoinHousehold] insert error:', error);
      setJoinError('Failed to join household. Please try again.');
      setIsJoining(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
    router.push('/week');
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
              onClick={handleJoin}
              className="w-full"
            >
              Join household
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
