import type { Developer, Project } from '@jayedaad/core';
import type { DisplayProject, ProjectCardData } from '@/lib/types';

const FALLBACK_IMAGE = '/images/images-gallery/1.jpg';

export function projectToCardData(project: Project): ProjectCardData {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    coverImageUrl: project.coverImageUrl ?? FALLBACK_IMAGE,
    city: project.city,
    area: project.area,
    status: project.status,
    verificationStatus: project.verificationStatus,
    unitTypeCount: project.unitTypeCount,
    priceRangeMin: project.priceRange?.min ?? 0,
    boostTier: project.boostTier,
    storyExpiresAt: project.storyExpiresAt,
  };
}

// Only the single-project detail endpoints (findBySlug/findById) populate
// unitTypes/paymentPlans/amenities — see Project's own comment in
// packages/core/src/models/index.ts. developer is a separate fetch
// (developersRepository.findBySlug) since Project.developer is only a
// DeveloperSummary (no bio/description for the sidebar card).
export function projectToDisplayProject(project: Project, developer: Developer): DisplayProject {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    developer: {
      id: developer.id,
      name: developer.name,
      logoUrl: developer.logoUrl ?? '/images/jayedaad-logo.png',
      description: developer.description ?? '',
      phone: developer.phone ?? '',
      whatsapp: developer.whatsapp ?? developer.phone ?? '',
      city: developer.city ?? project.city,
      email: developer.email,
    },
    description: project.description ?? '',
    city: project.city,
    area: project.area,
    status: project.status,
    possessionDate: project.possessionDate ?? new Date().toISOString(),
    coverImageUrl: project.coverImageUrl ?? FALLBACK_IMAGE,
    galleryImageUrls: project.galleryImageUrls.length > 0 ? project.galleryImageUrls : [project.coverImageUrl ?? FALLBACK_IMAGE],
    floorPlanUrls: project.floorPlanUrls,
    videoUrl: project.videoUrl,
    brochureUrl: project.brochureUrl,
    verificationStatus: project.verificationStatus,
    unitTypes: (project.unitTypes ?? []).map((unit) => ({
      id: unit.id,
      label: unit.label,
      propertyType: unit.propertyType.label,
      areaValueMin: Number(unit.areaValueMin ?? 0),
      areaValueMax: Number(unit.areaValueMax ?? unit.areaValueMin ?? 0),
      areaUnit: unit.areaUnit,
      priceMin: Number(unit.priceMin ?? 0),
      priceMax: Number(unit.priceMax ?? unit.priceMin ?? 0),
      bedrooms: unit.bedrooms ?? 0,
      bathrooms: unit.bathrooms ?? 0,
    })),
    paymentPlans: (project.paymentPlans ?? []).map((plan) => ({
      id: plan.id,
      label: plan.label,
      bookingPercent: plan.bookingPercent ?? 0,
      installmentCount: plan.installmentCount ?? 0,
      installmentFrequency: plan.installmentFrequency ?? '',
      balloonPaymentCount: plan.balloonPaymentCount ?? 0,
      description: plan.description ?? '',
    })),
    amenities: (project.amenities ?? []).map((a) => a.label),
    priceRange: project.priceRange ?? { min: 0, max: 0 },
  };
}