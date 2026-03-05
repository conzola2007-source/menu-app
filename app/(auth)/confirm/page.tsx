'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Supabase handles the token exchange automatically via the URL hash.
    // We subscribe to auth state changes and always unsubscribe on cleanup
    // to prevent a subscription leak when the component unmounts.
    const supabase = getSupabaseClient();
    let didRedirect = false;

    // Always create the subscription first so we never miss the SIGNED_IN
    // event that fires immediately after the magic-link token is exchanged.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session && !didRedirect) {
          didRedirect = true;
          setStatus('success');
          // Give the UI a moment to render the success state before navigating
          setTimeout(() => router.push('/'), 1500);
        }
      }
    );

    // Check if a session already exists (e.g. user refreshed the page after
    // the link was already exchanged).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !didRedirect) {
        didRedirect = true;
        setStatus('success');
        setTimeout(() => router.push('/'), 1500);
      }
    });

    // Always unsubscribe on cleanup — this was previously missing in the
    // else-branch of the getSession callback, causing a subscription leak.
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center shadow-xl">
      {status === 'loading' && (
        <>
          <div className="mb-3 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white">Confirming your email…</h2>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mb-3 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-semibold text-white">Email confirmed!</h2>
          <p className="text-sm text-slate-400">Taking you in…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-3 text-4xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold text-white">Something went wrong</h2>
          <p className="text-sm text-slate-400">The link may have expired. Try signing up again.</p>
        </>
      )}
    </div>
  );
}
