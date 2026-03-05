export default function PlanLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* Header */}
      <div className="animate-pulse border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-slate-800" />
          <div className="h-8 w-36 rounded-full bg-slate-800" />
        </div>
      </div>

      <div className="flex flex-1 gap-0">
        {/* Shortlist sidebar skeleton */}
        <div className="animate-pulse w-44 shrink-0 border-r border-slate-800 p-3 space-y-2">
          <div className="h-4 w-20 rounded bg-slate-800 mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-800" />
          ))}
        </div>

        {/* Calendar skeleton */}
        <div className="animate-pulse flex-1 overflow-x-auto p-3">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-32 shrink-0 space-y-2">
                <div className="h-8 rounded-lg bg-slate-800" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-14 rounded-xl bg-slate-800" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
