import Link from 'next/link';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-900 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 font-display">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Platform</p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">Super Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-black">
            <Link
              href="/platform"
              className="rounded-full px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Companies
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
            >
              App Login
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

