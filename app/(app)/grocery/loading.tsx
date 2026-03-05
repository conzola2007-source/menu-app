export default function GroceryLoading() {
  return (
    <div className="min-h-screen bg-slate-900 pb-32">
      {/* Header */}
      <div className="animate-pulse sticky top-0 z-20 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-20 rounded bg-slate-800" />
            <div className="h-3 w-28 rounded bg-slate-800" />
          </div>
          <div className="h-7 w-32 rounded-full bg-slate-800" />
        </div>
        {/* Progress bar */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-slate-800" />
          </div>
          <div className="h-1.5 rounded-full bg-slate-800" />
        </div>
      </div>

      {/* List skeleton */}
      <div className="animate-pulse flex flex-col gap-0 px-4 pt-4 space-y-1">
        {/* Recipe group header */}
        <div className="h-8 w-32 rounded bg-slate-800 mb-1" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-800" />
        ))}

        <div className="h-8 w-28 rounded bg-slate-800 mt-3 mb-1" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
