'use client';

import Link from 'next/link';
import { useHousehold } from '@/hooks/useHousehold';
import { useMealHistory } from '@/hooks/useMealHistory';

export default function HistoryPage() {
  const { data: membership, isLoading: householdLoading } = useHousehold();
  const householdId = membership?.household?.id ?? null;
  const { data: history = [], isLoading: historyLoading } = useMealHistory(householdId);

  const isLoading = householdLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-32 rounded-xl bg-slate-800" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
        <span className="text-5xl">🏠</span>
        <p className="font-medium text-white">You&apos;re not in a household yet</p>
      </div>
    );
  }

  // Group by week
  const byWeek = new Map<string, typeof history>();
  for (const entry of history) {
    const key = entry.week_start_date;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(entry);
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <h1 className="text-base font-bold text-white">Meal History</h1>
        <p className="text-xs text-slate-500">{history.length} meals cooked</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <span className="text-5xl">📅</span>
          <p className="font-medium text-white">No meal history yet</p>
          <p className="text-sm text-slate-400">
            Finalize a meal plan to start tracking your meals.
          </p>
          <Link
            href="/plan"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Go to meal plan →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pt-4">
          {[...byWeek.entries()].map(([weekStart, entries]) => {
            const weekDate = new Date(weekStart + 'T00:00:00');
            const label = weekDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            return (
              <section key={weekStart}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Week of {label}
                </p>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">
                  {entries.map((entry) => {
                    const date = new Date(entry.slot_date + 'T00:00:00');
                    const dayLabel = date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <Link
                        key={entry.slot_id}
                        href={`/recipes/${entry.recipe_id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{ backgroundColor: entry.recipe_bg_color }}
                        >
                          {entry.recipe_emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {entry.recipe_title}
                          </p>
                          <p className="text-xs text-slate-500">{dayLabel}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {entry.avg_stars != null && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-amber-400">
                                {entry.avg_stars.toFixed(1)}
                              </span>
                              <span className="text-amber-400 text-xs">★</span>
                            </div>
                          )}
                          {entry.chef_name && (
                            <p className="text-xs text-slate-600">{entry.chef_name}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
