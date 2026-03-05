import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
      <span className="text-6xl">🍽️</span>
      <h2 className="text-xl font-bold text-white">Page not found</h2>
      <p className="text-sm text-slate-400">
        That page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
      >
        Go home
      </Link>
    </div>
  );
}
