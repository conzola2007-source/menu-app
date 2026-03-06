'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Package, Trash2 } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { usePacks, useDeletePack } from '@/hooks/usePacks';
import { isHead } from '@/lib/roles';

export default function PacksPage() {
  const router = useRouter();
  const { data: membership } = useHousehold();
  const householdId = membership?.household?.id ?? null;
  const currentUserIsHead = membership ? isHead(membership.role) : false;
  const { data: packs = [], isLoading } = usePacks(householdId);
  const deletePack = useDeletePack();

  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.replace('/household')} className="text-slate-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-white">Meal packs</h1>
        </div>
        {currentUserIsHead && (
          <Link
            href="/packs/new"
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            New pack
          </Link>
        )}
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-slate-700 mb-3" />
            <p className="font-medium text-white">No packs yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Packs are pre-defined sets of meals you can quickly attach to a plan.
            </p>
            {currentUserIsHead && (
              <Link
                href="/packs/new"
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Create first pack
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-white">{pack.name}</p>
                    {pack.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{pack.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pack.items.map((item) => (
                        <span
                          key={item.id}
                          className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs text-white"
                          style={{ backgroundColor: item.recipe.bg_color + '33' }}
                        >
                          {item.recipe.emoji} {item.recipe.title}
                        </span>
                      ))}
                      {pack.items.length === 0 && (
                        <span className="text-xs text-slate-600">No recipes added</span>
                      )}
                    </div>
                  </div>
                  {currentUserIsHead && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/packs/${pack.id}/edit`}
                        className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          void deletePack.mutateAsync({ packId: pack.id, householdId: householdId! })
                        }
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Delete pack"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
