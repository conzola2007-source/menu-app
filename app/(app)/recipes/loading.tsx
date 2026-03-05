export default function RecipesLoading() {
  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header + search */}
      <div className="animate-pulse sticky top-0 z-20 border-b border-slate-800 bg-slate-900 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-slate-800" />
          <div className="h-8 w-24 rounded-full bg-slate-800" />
        </div>
        <div className="h-9 rounded-xl bg-slate-800" />
        {/* Filter chips */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-16 rounded-full bg-slate-800" />
          ))}
        </div>
      </div>

      {/* Recipe grid */}
      <div className="animate-pulse grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
