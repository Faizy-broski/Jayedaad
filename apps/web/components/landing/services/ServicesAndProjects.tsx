// components/ServicesAndProjects.tsx
import Image from 'next/image';
import { EverythingUnderOneRoof } from '@/components/landing/services/EveryThingUnderRoof';
import { ComingProjects } from './ComingProjects';
import { SERVICES } from '@/data/services';
import { COMING_PROJECTS } from '@/data/comingProjects';

export function ServicesAndProjects() {
  return (
    <div className="relative overflow-hidden py-12">
      {/* Watermark sized to sit mostly behind "Everything under one roof"
          and taper off — bottom-anchored with a mask so only a sliver
          bleeds into the top of the Coming Project section below it,
          rather than repeating the image a second time. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 left-1/3 h-[60%] max-w-4xl"
      >
        <Image src="/images/bg-image.png" alt="" fill sizes="100vw" className="object-cover object-right" />
      </div>

      <EverythingUnderOneRoof services={SERVICES} />
      <ComingProjects projects={COMING_PROJECTS} />
    </div>
  );
}