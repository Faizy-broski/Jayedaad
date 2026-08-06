'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Eye, Tag, Clock, BadgeCheck, CalendarCheck, Heart, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { TestimonialCard } from '@/components/landing/testimonials/TestimonialCards';
import { PropertyGallery } from './PropertyGallery';
import { AgentCard } from './AgentCard';
import { PropertyStats } from './PropertyStats';
import { PropertyAmenities } from './PropertyAmenities';
import { PropertyLocation } from './PropertyLocation';
import { MortgageCalculator } from './MortgageCalculator';
import { InvestmentAnalysis } from './InvestmentAnalysis';
import { SimilarProperties } from './SimilarProperties';
import { TESTIMONIALS } from '@/data/testimonials';
import type { ListingProperty } from '@/lib/types';

const EASE = [0.16, 1, 0.3, 1] as const;

// Deterministic per-id pseudo-stats (view count, short reference id) — a real
// backend would track these; a stable hash keeps SSR/client output identical
// instead of drifting like Math.random() would.
function hashToRange(id: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min));
}

interface PropertyDetailProps {
  listing: ListingProperty;
  similar: ListingProperty[];
}

export function PropertyDetail({ listing, similar }: PropertyDetailProps) {
  const [saved, setSaved] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const city = listing.location.split(',').pop()?.trim() ?? listing.location;
  const views = hashToRange(listing.id, 800, 3200);
  const referenceId = `JYD-${hashToRange(listing.id, 100, 999)}`;
  const gallery = [
    '/images/images-gallery/1.jpg',
    '/images/images-gallery/2.jpg',
    '/images/images-gallery/3.jpg',
    '/images/images-gallery/4.jpg',
  ];

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
        <Link href="/listings" className="hover:text-primary">
          Properties
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{city}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">{listing.title}</span>
      </motion.nav>

      <PropertyGallery images={gallery} title={listing.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-10">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              {listing.verified && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {listing.listingType === 'sale' ? 'For Sale' : 'For Rent'}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {listing.propertyType}
              </span>
            </div>

            <h1 className="heading-1 mt-3 text-slate-900">{listing.title}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location}
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
              <span className="text-2xl font-bold text-primary">{listing.price}</span>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-heading-gradient px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <CalendarCheck className="h-4 w-4" />
                Schedule visit
              </button>
              <button
                type="button"
                onClick={() => setSaved((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
                Save property
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <PropertyStats listing={listing} />
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Description</h2>
            <p className={`body-text mt-3 text-slate-600 ${descriptionExpanded ? '' : 'line-clamp-3'}`}>
              {listing.description}
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
            <h2 className="heading-2 text-heading-gradient">Amenities</h2>
            <div className="mt-4">
              <PropertyAmenities amenities={listing.amenities} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Location &amp; neighborhood</h2>
            <div className="mt-4">
              <PropertyLocation listing={listing} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Mortgage calculator</h2>
            <div className="mt-4">
              <MortgageCalculator priceValue={listing.priceValue} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Investment analysis</h2>
            <div className="mt-4">
              <InvestmentAnalysis listing={listing} />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="heading-2 text-heading-gradient">Verified reviews</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {TESTIMONIALS.slice(0, 2).map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="lg:sticky lg:top-24 lg:h-fit"
        >
          <AgentCard agent={listing.agent} />
        </motion.div>
      </div>

      {similar.length > 0 && (
        <Reveal className="mt-14" delay={0.1}>
          <SimilarProperties properties={similar} />
        </Reveal>
      )}
    </div>
  );
}
