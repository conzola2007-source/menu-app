export default function RecipeDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="animate-pulse relative h-52 bg-slate-800">
        <div className="absolute bottom-4 left-4 space-y-2">
          <div className="h-4 w-20 rounded-full bg-slate-700" />
          <div className="h-7 w-48 rounded bg-slate-700" />
        </div>
        <div className="absolute left-3 top-3 h-9 w-9 rounded-full bg-slate-700" />
      </div>

      <div className="animate-pulse px-4 pt-4 space-y-4">
        {/* Time badges */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-slate-800" />
          ))}
        </div>

        {/* Servings */}
        <div className="h-10 rounded-xl bg-slate-800" />

        {/* Ingredients header */}
        <div className="h-5 w-28 rounded bg-slate-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-800" />
        ))}

        {/* Steps header */}
        <div className="h-5 w-16 rounded bg-slate-800 mt-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
