'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Global sign out error, trying local sign out:', error);
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (err) {
      console.error('Sign out error catch:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localErr) {
        console.error('Local sign out error:', localErr);
      }
    }

    // Force local storage cleanup of Supabase tokens
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      } catch (storageErr) {
        console.error('Failed to clear localStorage:', storageErr);
      }
    }

    router.push('/login');
    router.refresh();
  }

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="w-full min-h-screen relative flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-950/20 via-[#060814] to-[#060814] pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950/60 backdrop-blur-xl border-r border-slate-800/60 flex flex-col justify-between z-20">
        <div className="flex flex-col">
          {/* Logo area */}
          <div className="px-6 py-8 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.011 19.851c-1.394 1.157-3.155 1.854-5.077 1.854-4.385 0-7.94-3.555-7.94-7.94 0-1.922.697-3.683 1.854-5.077M20.303 14.545c.677-1.423 1.061-3.02 1.061-4.707 0-6.075-4.925-11-11-11-1.687 0-3.284.384-4.707 1.061m14.551 14.551a9.76 9.76 0 0 1-5.696 2.24m5.696-2.24c1.55-1.55 2.502-3.693 2.502-6.06 0-2.368-.952-4.51-2.502-6.06m-2.24 12.12a9.76 9.76 0 0 1-2.24 5.696m2.24-5.696V12m-6.06-6.06a9.76 9.76 0 0 1 6.06-2.24m-6.06 2.24c-1.55 1.55-2.502 3.693-2.502 6.06 0 2.368.952 4.51 2.502 6.06m-3.82-12.12a9.76 9.76 0 0 1 2.24-5.696m-2.24 5.696v2.24" />
              </svg>
            </div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 text-lg tracking-tight">
              Signal Hunter
            </span>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex flex-col gap-1.5 mt-6">
            <Link
              href="/signals"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${pathname === '/signals' || pathname.startsWith('/companies/') ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_-3px_rgba(20,184,166,0.1)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}
            >
              <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <span>Señales</span>
            </Link>

            <Link
              href="/outreach"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${pathname === '/outreach' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_-3px_rgba(20,184,166,0.1)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'}`}
            >
              <svg className="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
              </svg>
              <span>Outreach</span>
            </Link>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex flex-col gap-3">
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 hover:border hover:border-rose-500/10 border border-transparent transition-all duration-200 font-semibold text-xs text-left"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
          
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Estado</span>
            <span className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live Radar
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-64 z-10 relative">
        <div className="p-8 max-w-7xl mx-auto w-full min-h-screen flex flex-col justify-between">
          {children}
          
          {/* Elegant footer */}
          <footer className="mt-20 pt-6 border-t border-slate-800/40 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} Signal Hunter · Prospección Local Inteligente · Nivel Midas
          </footer>
        </div>
      </main>
    </div>
  );
}
