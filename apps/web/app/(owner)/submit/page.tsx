'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaUnit,
  CreateListingInput,
  FurnishingStatus,
  ListingPurpose,
  useListingSubmissionViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES: FurnishingStatus[] = ['unfurnished', 'semi_furnished', 'furnished'];

// Owner/seller listing submission — the write side of the Manual Verification
// vertical slice [Spec §7]. Every field here maps 1:1 to CreateListingDto
// (services/api/src/listings/dto/create-listing.dto.ts); status is never a
// field the owner controls — the API always starts a submission pending_verification.
export default function SubmitListingPage() {
  const router = useRouter();
  const { propertyTypes, isLoading: propertyTypesLoading } = useTaxonomyViewModel();
  const { submit } = useListingSubmissionViewModel();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    purpose: 'sale' as ListingPurpose,
    propertyTypeId: '',
    city: '',
    area: '',
    society: '',
    subArea: '',
    bedrooms: '',
    bathrooms: '',
    areaValue: '',
    areaUnit: 'marla' as AreaUnit,
    yearBuilt: '',
    floorLevel: '',
    furnishingStatus: '' as FurnishingStatus | '',
  });
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());

  // Amenities are scoped to the selected property type's category (Homes/
  // Plots/Commercial) — a Plot shouldn't be offered Drawing Room. Re-fetches
  // (and re-scopes) whenever the property type changes.
  const selectedCategorySlug = propertyTypes.find((type) => type.id === form.propertyTypeId)?.category.slug;
  const { amenities, isLoading: amenitiesLoading } = useTaxonomyViewModel(selectedCategorySlug);
  const taxonomyLoading = propertyTypesLoading || amenitiesLoading;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // A category change can invalidate previously-checked amenities (the API
    // now rejects amenities that don't belong to the listing's property type).
    if (key === 'propertyTypeId') setSelectedAmenities(new Set());
  }

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const input: CreateListingInput = {
      title: form.title,
      description: form.description || undefined,
      price: Number(form.price),
      purpose: form.purpose,
      propertyTypeId: form.propertyTypeId,
      city: form.city,
      area: form.area,
      society: form.society || undefined,
      subArea: form.subArea || undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      areaValue: Number(form.areaValue),
      areaUnit: form.areaUnit,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      floorLevel: form.floorLevel || undefined,
      furnishingStatus: form.furnishingStatus || undefined,
      amenities: Array.from(selectedAmenities).map((slug) => ({ slug })),
    };

    const listing = await submit.mutateAsync(input);
    router.push(`/search?submitted=${listing.id}`);
  }

  const amenitiesByCategory = amenities.reduce<Record<string, typeof amenities>>((acc, amenity) => {
    (acc[amenity.category] ??= []).push(amenity);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">List Your Property</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every submission is reviewed by our verification team before it goes live — see our{' '}
        <a href="/" className="underline">
          verification process
        </a>
        .
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-medium">Basics</legend>
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          />
          <div className="flex gap-2">
            <select
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value as ListingPurpose)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <select
              required
              value={form.propertyTypeId}
              onChange={(e) => update('propertyTypeId', e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
              disabled={taxonomyLoading}
            >
              <option value="">Property type…</option>
              {propertyTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <input
            required
            type="number"
            min="0"
            placeholder="Price (PKR)"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-medium">Location</legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              required
              placeholder="Area (e.g. Bahria Town)"
              value={form.area}
              onChange={(e) => update('area', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              placeholder="Society/Phase/Block"
              value={form.society}
              onChange={(e) => update('society', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              placeholder="Sub-area"
              value={form.subArea}
              onChange={(e) => update('subArea', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-medium">Details</legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Bedrooms"
              value={form.bedrooms}
              onChange={(e) => update('bedrooms', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              type="number"
              min="0"
              placeholder="Bathrooms"
              value={form.bathrooms}
              onChange={(e) => update('bathrooms', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Area"
              value={form.areaValue}
              onChange={(e) => update('areaValue', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <select
              value={form.areaUnit}
              onChange={(e) => update('areaUnit', e.target.value as AreaUnit)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              placeholder="Year built"
              value={form.yearBuilt}
              onChange={(e) => update('yearBuilt', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <input
              placeholder="Floor/Level"
              value={form.floorLevel}
              onChange={(e) => update('floorLevel', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            />
            <select
              value={form.furnishingStatus}
              onChange={(e) => update('furnishingStatus', e.target.value as FurnishingStatus)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
            >
              <option value="">Furnishing…</option>
              {FURNISHING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {Object.entries(amenitiesByCategory).map(([category, items]) => (
          <fieldset key={category} className="space-y-2">
            <legend className="font-medium capitalize">{category.replace(/_/g, ' ')}</legend>
            <div className="flex flex-wrap gap-3">
              {items.map((amenity) => (
                <label key={amenity.slug} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.has(amenity.slug)}
                    onChange={() => toggleAmenity(amenity.slug)}
                  />
                  {amenity.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {submit.isError && <p className="text-sm text-red-600">Something went wrong — please try again.</p>}

        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit for Verification'}
        </Button>
      </form>
    </main>
  );
}
