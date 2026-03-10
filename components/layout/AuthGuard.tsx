'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useHousehold } from '@/hooks/useHousehold';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isGuest, isLoading } = useAuthStore();
  const { data: membership, isLoading: householdLoading } = useHousehold();

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isGuest) {
      router.replace('/sign-in');
      return;
    }

    // Don't redirect on pages that are part of the household setup flow
    const isSetupPath =
      pathname === '/onboarding' ||
      pathname === '/household/create' ||
      pathname.startsWith('/household/join');
    if (!isGuest && !householdLoading && !membership && !isSetupPath) {
      router.replace('/household/create');
    }
  }, [user, isGuest, isLoading, membership, householdLoading, router, pathname]);

  // Show nothing while loading auth state
  if (isLoading || (!isGuest && householdLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user && !isGuest) return null;

  return <>{children}</>;
}
