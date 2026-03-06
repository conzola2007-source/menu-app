export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded-xl bg-slate-800" />
        <div className="h-6 w-1/4 rounded-lg bg-slate-800" />
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
