import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '../components/layout/Header';
import './globals.css';
import { SiteFooter } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Jayedaad — Building Trust in Real Estate',
  description: 'Verified real estate marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* overflow-x-hidden guards against the classic `w-screen`/`100vw`
          full-bleed bug (see OfficeShowCase.tsx) — 100vw includes the
          scrollbar's own width on browsers with a classic (non-overlay)
          scrollbar, so a `w-screen` element sits a few px wider than the
          visible viewport and forces a horizontal scrollbar site-wide. */}
      <body className="min-h-screen overflow-x-hidden bg-white text-foreground">
        <Providers>
          <Header />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
