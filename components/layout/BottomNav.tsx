'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Vote, CalendarDays, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/week',    label: 'This Week', icon: Home },
  { href: '/vote',    label: 'Vote',      icon: Vote },
  { href: '/plan',    label: 'Plan',      icon: CalendarDays },
  { href: '/grocery', label: 'Grocery',   icon: ShoppingCart },
  { href: '/recipes', label: 'Recipes',   icon: UtensilsCrossed },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900 pb-safe md:hidden">
        <div className="flex h-16 items-stretch">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
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
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
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
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
