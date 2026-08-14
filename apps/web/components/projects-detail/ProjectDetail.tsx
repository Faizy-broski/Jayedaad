'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Eye, Tag, Clock, BadgeCheck, Heart, ChevronRight } from 'lucide-react';
import { useFormattedPrice } from '@jayedaad/core';
import { Reveal } from '@/components/Reveal';
import { ProjectGallery } from './ProjectGallery';
import { DeveloperCard } from './DeveloperCard';
import { ProjectStats } from './ProjectStats';
import { ProjectUnitTypes } from './ProjectUnitTypes';
import { ProjectPaymentPlans } from './ProjectPaymentPlans';
import { ProjectAmenities } from './ProjectAmenities';
import { SimilarProjects } from './SimilarProjects';
import type { DisplayProject, ProjectCardData } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

const STATUS_LABEL: Record<DisplayProject['status'], string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

function hashToRange(id: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min));
}

interface ProjectDetailProps {
  project: DisplayProject;
  similar: ProjectCardData[];
}

export function ProjectDetail({ project, similar }: ProjectDetailProps) {
  const [saved, setSaved] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  // Was a local, PKR-only formatPrice() — listing prices everywhere else
  // go through this currency-aware hook, project prices never got the same
  // treatment and silently ignored the user's preferredCurrency setting.
  const { format: formatPrice } = useFormattedPrice();

  const views = hashToRange(project.id, 800, 3200);
  const referenceId = `JYD-PRJ-${hashToRange(project.id, 100, 999)}`;

  return (
    // pt is clearance for the Header, which is fixed/floating (out of flow)
    // on this route instead of the plain in-flow sticky bar — see
    // isHeroRoute() in components/layout/Header.tsx.
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 sm:pb-10 sm:pt-28 lg:pt-32">
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-1.5 text-xs text-slate-500"
      >
        <Link href="/developments" className="hover:text-primary">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{project.city}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">{project.name}</span>
      </motion.nav>

      <ProjectGallery
        images={project.galleryImageUrls}
        title={project.name}
        floorPlanUrls={project.floorPlanUrls}
        videoUrl={project.videoUrl}
        brochureUrl={project.brochureUrl}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-10">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              {project.verificationStatus === 'verified' && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {STATUS_LABEL[project.status]}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {project.developer.name}
              </span>
            </div>

            <h1 className="heading-1 mt-3 text-slate-900">{project.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.area}, {project.city}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {views.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {referenceId}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Updated 2 days ago
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {project.priceRange.max !== project.priceRange.min
                  ? `${formatPrice(project.priceRange.min)} – ${formatPrice(project.priceRange.max)}`
                  : formatPrice(project.priceRange.min)}
              </span>
              <button
                type="button"
                onClick={() => setSaved((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
                Save project
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <ProjectStats project={project} />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Description</h2>
            <p className={`body-text mt-3 text-slate-600 ${descriptionExpanded ? '' : 'line-clamp-3'}`}>
              {project.description}
            </p>
            <button
              type="button"
              onClick={() => setDescriptionExpanded((v) => !v)}
              className="mt-1 text-sm font-medium text-primary hover:underline"
            >
              {descriptionExpanded ? 'Read less' : 'Read more'}
            </button>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Unit types</h2>
            <div className="mt-4">
              <ProjectUnitTypes unitTypes={project.unitTypes} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Payment plans</h2>
            <div className="mt-4">
              <ProjectPaymentPlans plans={project.paymentPlans} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Amenities</h2>
            <div className="mt-4">
              <ProjectAmenities amenities={project.amenities} />
            </div>
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="lg:sticky lg:top-24 lg:h-fit"
        >
          <DeveloperCard developer={project.developer} projectId={project.id} projectTitle={project.name} />
        </motion.div>
      </div>

      {similar.length > 0 && (
        <Reveal className="mt-14" delay={0.1}>
          <SimilarProjects projects={similar} />
        </Reveal>
      )}
    </div>
  );
}
