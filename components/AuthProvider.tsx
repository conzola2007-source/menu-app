'use client';

import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading, setGuest } = useAuthStore();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Restore guest mode from cookie so that isGuest survives page refreshes.
    // The cookie is set when the user clicks "Continue as guest" and is also
    // read by the middleware — keeping server and client in sync.
    if (document.cookie.includes('menu-guest=1')) {
      setGuest(true);
    }

    // Get initial session — wrapped in try/catch so the app doesn't hang
    // on the loading spinner when Supabase is not yet configured.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        // Real user signed in — clear guest mode
        setGuest(false);
        document.cookie = 'menu-guest=; path=/; max-age=0; SameSite=Lax';
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, setGuest]);

  return <>{children}</>;
}
