import type { Metadata } from 'next';
import { Providers } from './providers';
import { ReachOutToExperts } from '../components/ReachOutToExperts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jayedaad — Building Trust in Real Estate',
  description: 'Verified real estate marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Providers>
          {children}
          <ReachOutToExperts />
        </Providers>
      </body>
    </html>
  );
}
