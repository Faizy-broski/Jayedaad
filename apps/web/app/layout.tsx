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
      <body className="min-h-screen bg-white text-foreground">
        <Providers>
          <Header />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
