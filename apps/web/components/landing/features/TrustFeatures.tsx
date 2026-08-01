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
    <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-start justify-center gap-x-6 gap-y-8 px-4 pb-16 pt-16 sm:pt-12 sm:gap-x-10 md:pb-20 lg:flex-nowrap lg:justify-between lg:gap-x-0 lg:divide-x lg:divide-slate-200">
      {FEATURES.map(({ label, icon: Icon }, index) => (
        <Reveal
          key={label}
          delay={index * 0.08}
          className="flex w-[30%] max-w-[120px] flex-col items-center gap-3 text-center sm:w-auto sm:max-w-none sm:gap-6 sm:px-6 lg:flex-1 lg:px-6"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary sm:h-11 sm:w-11">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-xs font-medium leading-tight text-slate-500">{label}</span>
        </Reveal>
      ))}
    </div>
  );
}