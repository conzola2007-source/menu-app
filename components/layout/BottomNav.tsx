'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, CalendarDays, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useMyRecipeCookRequests } from '@/hooks/useRecipeCookRequests';

function AccountIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: requests = [] } = useMyRecipeCookRequests(userId);
  return (
    <span className="relative">
      <User size={size} strokeWidth={strokeWidth} />
      {requests.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-red-500" />
      )}
    </span>
  );
}

const TABS = [
  {
    href: '/household',
    label: 'Household',
    icon: Users,
    // active for all household sub-routes
    prefixes: ['/household'],
  },
  {
    href: '/vote',
    label: 'Plan',
    icon: CalendarDays,
    prefixes: ['/planned', '/week', '/vote', '/plan', '/grocery', '/recipes', '/history'],
  },
  {
    href: '/account',
    label: 'Account',
    icon: User,
    prefixes: ['/account', '/profile'],
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav in full-screen shopping mode
  if (pathname === '/grocery/shopping') return null;

  function isActive(prefixes: readonly string[]) {
    return prefixes.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900 pb-safe md:hidden">
        <div className="flex h-16 items-stretch">
          {TABS.map(({ href, label, icon: Icon, prefixes }) => {
            const active = isActive(prefixes);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {href === '/account' ? (
                  <AccountIcon size={22} strokeWidth={active ? 2.5 : 1.8} />
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                )}
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop left sidebar */}
      <nav className="fixed left-0 top-0 hidden h-full w-56 flex-col border-r border-slate-700 bg-slate-900 py-6 md:flex">
        <div className="mb-8 px-5">
          <span className="text-lg font-bold text-white">Menu</span>
        </div>
        <div className="flex flex-col gap-1 px-3">
          {TABS.map(({ href, label, icon: Icon, prefixes }) => {
            const active = isActive(prefixes);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                {href === '/account' ? (
                  <AccountIcon size={18} strokeWidth={active ? 2.5 : 1.8} />
                ) : (
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                )}
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
