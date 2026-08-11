import {
  ShieldCheck,
  Sparkles,
  Users,
  Lock,
  Headset,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";

const FEATURES = [
  { label: "Verified Listings", icon: ShieldCheck },
  { label: "AI Search", icon: Sparkles },
  { label: "Trusted Agents", icon: Users },
  { label: "Secure Payments", icon: Lock },
  { label: "24/7 Support", icon: Headset },
];

export function TrustFeatures() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-8 md:py-18">
      <div className="grid grid-cols-2 gap-y-10 gap-x-6 sm:grid-cols-3 md:grid-cols-5 md:gap-8 lg:divide-x lg:divide-slate-200">
        {FEATURES.map(({ label, icon: Icon }, index) => (
          <Reveal
            key={label}
            delay={index * 0.08}
            className="group flex flex-col items-center text-center lg:px-6 cursor-pointer"
          >
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition-all duration-300 ease-out group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25">
              <Icon
                className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-110"
                strokeWidth={1.75}
              />
            </span>

            <span className="text-sm font-medium leading-snug text-slate-600 transition-colors duration-300 group-hover:text-primary">
              {label}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}