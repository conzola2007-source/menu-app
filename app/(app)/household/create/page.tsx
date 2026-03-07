'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Household name must be at least 2 characters')
    .max(60, 'Household name must be at most 60 characters'),
});

type FormData = z.infer<typeof schema>;

const INVITE_CODE_RE = /^[A-Z0-9]{6}$/;

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

export default function CreateHouseholdPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveHousehold = useAuthStore((s) => s.setActiveHousehold);
  const [serverError, setServerError] = useState('');

  // ── Join section state ──────────────────────────────────────────────────────
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setServerError('You must be signed in to create a household.');
      return;
    }

    const inviteCode = generateInviteCode();

    const { data: householdRaw, error: householdError } = await supabase
      .from('households')
      .insert({ name: data.name, owner_id: user.id, invite_code: inviteCode } as never)
      .select()
      .single();

    if (householdError) {
      console.error('[CreateHousehold] insert error:', householdError);
      setServerError('Failed to create household. Please try again.');
      return;
    }

    const household = householdRaw as unknown as { id: string };

    const { error: memberError } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, role: 'head_of_household', is_creator: true } as never);

    if (memberError) {
      console.error('[CreateHousehold] member insert error:', memberError);
      setServerError('Household created but failed to add you as a member. Please try again.');
      return;
    }

    // Auto-add any recipes the user saved during onboarding into the household pool
    const { data: savedRecipes } = await supabase
      .from('user_saved_global_recipes')
      .select('recipe_id')
      .eq('user_id', user.id);
    if (savedRecipes && savedRecipes.length > 0) {
      const poolEntries = savedRecipes.map((r: { recipe_id: string }) => ({
        household_id: household.id,
        recipe_id: r.recipe_id,
        added_by: user.id,
      }));
      await supabase
        .from('household_recipes')
        .insert(poolEntries as never);
    }

    setActiveHousehold(household.id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.household.current(household.id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.household.all() });
    router.push('/household');
  }

  function handleJoinSubmit() {
    const normalised = joinCode.toUpperCase().trim();
    if (!INVITE_CODE_RE.test(normalised)) {
      setJoinError('Invite codes are 6 characters (letters and numbers).');
      return;
    }
    router.push(`/household/join?code=${normalised}`);
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🏠</div>
          <h1 className="text-2xl font-bold text-white">Get started</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create a household or join one with an invite code
          </p>
        </div>

        {/* Create section */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Create new
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Household name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. The Smith House"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {serverError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {serverError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Create household
            </Button>
          </form>
        </div>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-700" />
          <span className="text-xs text-slate-600">or</span>
          <div className="flex-1 border-t border-slate-700" />
        </div>

        {/* Join section */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Join with invite code
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="K7XM2P"
                maxLength={6}
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                className="font-mono tracking-widest uppercase"
              />
              <Button
                type="button"
                disabled={joinCode.length < 6}
                onClick={handleJoinSubmit}
                className="shrink-0"
              >
                Join
              </Button>
            </div>
            {joinError && (
              <p className="text-xs text-red-400">{joinError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
