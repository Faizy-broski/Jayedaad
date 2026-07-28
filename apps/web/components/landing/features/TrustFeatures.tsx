import { ShieldCheck, Sparkles, Users, Lock, Headset } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const FEATURES = [
  { label: 'Verified Listings', icon: ShieldCheck },
  { label: 'AI Search', icon: Sparkles },
  { label: 'Trusted Agents', icon: Users },
  { label: 'Secure Payments', icon: Lock },
  { label: '24/7 Support', icon: Headset },
];

export function TrustFeatures() {
  return (
    <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10   gap-y-6 px-4 pb-16 pt-24 sm:pt-12 md:pb-20 lg:divide-x lg:divide-slate-200">
      {FEATURES.map(({ label, icon: Icon }, index) => (
        <Reveal key={label} delay={index * 0.08} className="flex flex-col items-center gap-6 px-12">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </Reveal>
      ))}
    </div>
  );
}