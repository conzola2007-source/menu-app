import { AuthGuard } from '@/components/layout/AuthGuard';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Desktop: offset content for sidebar; mobile: offset for bottom nav */}
      <div className="flex min-h-screen bg-slate-900 md:pl-56">
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
