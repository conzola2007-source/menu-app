export default function VoteLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="animate-pulse flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-24 rounded bg-slate-800" />
            <div className="h-3 w-32 rounded bg-slate-800" />
          </div>
          <div className="h-8 w-20 rounded-full bg-slate-800" />
        </div>
      </div>

      {/* Card stack skeleton */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-pulse w-full max-w-sm space-y-4">
          {/* Card */}
          <div className="h-80 rounded-3xl bg-slate-800" />

          {/* Buttons */}
          <div className="flex items-center justify-center gap-6">
            <div className="h-16 w-16 rounded-full bg-slate-800" />
            <div className="h-12 w-12 rounded-full bg-slate-800" />
            <div className="h-16 w-16 rounded-full bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
