export default function PantryCheckLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* Header */}
      <div className="animate-pulse border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-slate-800" />
              <div className="h-3 w-32 rounded bg-slate-800" />
            </div>
          </div>
          <div className="h-4 w-20 rounded bg-slate-800" />
        </div>
        <div className="mt-2 h-1 rounded-full bg-slate-800" />
      </div>

      {/* Section tabs */}
      <div className="animate-pulse flex gap-2 border-b border-slate-800 px-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-20 rounded-full bg-slate-800" />
        ))}
      </div>

      {/* Card skeleton */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-pulse w-full max-w-sm space-y-6">
          <div className="h-64 rounded-3xl bg-slate-800" />
          <div className="flex items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-800" />
            <div className="h-12 w-12 rounded-full bg-slate-800" />
            <div className="h-14 w-14 rounded-full bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
