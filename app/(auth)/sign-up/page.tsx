'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';

const schema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(40, 'Name must be at most 40 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function SignUpPage() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.displayName },
      },
    });

    if (error) {
      // Map known Supabase error codes to safe user-facing messages.
      // Never echo raw error strings — they can leak internal service details.
      if (error.message.toLowerCase().includes('already registered')) {
        setServerError('An account with this email already exists. Try signing in.');
      } else {
        setServerError('Could not create account. Please try again.');
      }
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center shadow-xl">
        <div className="mb-3 text-4xl">📬</div>
        <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
        <p className="text-sm text-slate-400">
          We sent a confirmation link to your email. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
      <h2 className="mb-6 text-xl font-semibold text-white">Create account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Your name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="e.g. Yasser"
            autoComplete="name"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
