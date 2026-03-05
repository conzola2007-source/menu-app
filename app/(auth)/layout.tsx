export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">🍽️</div>
          <h1 className="text-2xl font-bold text-white">Menu</h1>
          <p className="mt-1 text-sm text-slate-400">Household meal planning</p>
        </div>
        {children}
      </div>
    </div>
  );
}
