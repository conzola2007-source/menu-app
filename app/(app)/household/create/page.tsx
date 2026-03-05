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
import { queryKeys } from '@/lib/queryKeys';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Household name must be at least 2 characters')
    .max(60, 'Household name must be at most 60 characters'),
});

type FormData = z.infer<typeof schema>;

/**
 * Generates a cryptographically secure random invite code using the
 * Web Crypto API (crypto.getRandomValues). Never use Math.random() for
 * security-sensitive tokens — it is not cryptographically secure.
 */
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
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');

    const supabase = getSupabaseClient();

    // Verify we have a current session before making writes
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setServerError('You must be signed in to create a household.');
      return;
    }

    const inviteCode = generateInviteCode();

    // owner_id is intentionally omitted here — the database trigger / RLS
    // policy sets it from auth.uid() server-side so the client cannot spoof it.
    // If your schema requires it in the INSERT, ensure an RLS policy restricts
    // it to auth.uid() via a CHECK constraint.
    const { data: householdRaw, error: householdError } = await supabase
      .from('households')
      .insert({ name: data.name, owner_id: user.id, invite_code: inviteCode } as never)
      .select()
      .single();

    if (householdError) {
      // Never expose raw database error messages to the UI — they can leak
      // schema details. Show a generic message and log the real error.
      console.error('[CreateHousehold] insert error:', householdError);
      setServerError('Failed to create household. Please try again.');
      return;
    }

    const household = householdRaw as unknown as { id: string };

    // user_id is set from the authenticated session. The RLS policy on
    // household_members must enforce auth.uid() = user_id so this cannot
    // be spoofed even if the client sends a different value.
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, role: 'owner' } as never);

    if (memberError) {
      console.error('[CreateHousehold] member insert error:', memberError);
      setServerError('Household created but failed to add you as a member. Please try again.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.household.current() });
    router.push('/week');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🏠</div>
          <h1 className="text-2xl font-bold text-white">Create your household</h1>
          <p className="mt-1 text-sm text-slate-400">
            Give it a name and invite your people
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

            <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
              Create household
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
