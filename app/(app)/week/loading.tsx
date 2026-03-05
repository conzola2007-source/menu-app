export default function WeekLoading() {
  return (
    <div className="min-h-screen bg-slate-900 pb-24 px-4 pt-4">
      <div className="animate-pulse space-y-3">
        {/* Header skeleton */}
        <div className="sticky top-0 -mx-4 border-b border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-36 rounded bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-800" />
            </div>
            <div className="h-7 w-16 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Banner skeleton */}
        <div className="h-12 rounded-xl bg-slate-800" />

        {/* Today card (taller) */}
        <div className="h-32 rounded-2xl bg-slate-800" />

        {/* Remaining days */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-800" />
        ))}

        {/* Quick actions */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
