'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/signals');
      }
    });

    // Escuchar cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session && pathname === '/login') {
        router.push('/signals');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#060814] flex flex-col items-center justify-center space-y-4 z-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-950/20 via-[#060814] to-[#060814] pointer-events-none" />
        <div className="w-10 h-10 rounded-full border-2 border-teal-500/25 border-t-teal-500 animate-spin" />
        <span className="text-slate-500 text-xs font-bold tracking-widest uppercase select-none animate-pulse">
          Autenticando Radar...
        </span>
      </div>
    );
  }

  // Si no está logueado y no está en la página de login, evitamos parpadeo de contenido privado
  if (!user && pathname !== '/login') {
    return (
      <div className="fixed inset-0 bg-[#060814] flex items-center justify-center z-50">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500/25 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
