import type { Metadata } from 'next';
import './globals.css';
import { Outfit } from 'next/font/google';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cazador de Señales',
  description: 'Dashboard de prospección trigger-based',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${outfit.className} bg-[#060814] text-slate-100 min-h-screen antialiased selection:bg-teal-500 selection:text-[#060814]`}>
        <AuthGuard>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </AuthGuard>
      </body>
    </html>
  );
}
