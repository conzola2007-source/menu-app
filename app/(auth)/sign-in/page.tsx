'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const setGuest = useAuthStore((s) => s.setGuest);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError('');
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Return a generic authentication failure message. Never echo the raw
      // Supabase error string — it can reveal whether an email is registered
      // (user enumeration) and expose internal service details.
      setServerError('Invalid email or password.');
      return;
    }

    router.push('/');
  }

  function handleContinueAsGuest() {
    setGuest(true);
    // Set a short-lived cookie the middleware can read. Without this the
    // server-side middleware has no knowledge of the client-side isGuest flag
    // and redirects every request back to /sign-in.
    document.cookie = 'menu-guest=1; path=/; max-age=86400; SameSite=Lax';
    router.push('/week');
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            autoComplete="current-password"
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
          Sign in
        </Button>
      </form>

      <div className="mt-5 flex flex-col gap-2 text-center text-sm text-slate-400">
        <p>
          No account?{' '}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
        <button
          type="button"
          onClick={handleContinueAsGuest}
          className="text-slate-500 hover:text-slate-300 hover:underline"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
