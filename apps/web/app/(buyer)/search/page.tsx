'use client';

import { useState } from 'react';
import { AreaUnit, ListingPurpose, useListingSearchViewModel, useTaxonomyViewModel } from '@jayedaad/core';

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];

// Buyer search — View only. All data fetching/business logic lives in
// useListingSearchViewModel / useTaxonomyViewModel (packages/core), shared
// verbatim with apps/mobile. Filters mirror the primary search facets on
// Zameen.com/Zillow: property type, purpose, bedrooms/bathrooms, area range.
export default function SearchPage() {
  const { propertyTypes } = useTaxonomyViewModel();

  const [city, setCity] = useState('');
  const [propertyTypeSlug, setPropertyTypeSlug] = useState('');
  const [purpose, setPurpose] = useState<ListingPurpose | ''>('');
  const [bedrooms, setBedrooms] = useState('');
  const [minBathrooms, setMinBathrooms] = useState('');
  const [minAreaValue, setMinAreaValue] = useState('');
  const [maxAreaValue, setMaxAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('marla');

  const { listings, isLoading } = useListingSearchViewModel({
    city: city || undefined,
    propertyTypeSlug: propertyTypeSlug || undefined,
    purpose: purpose || undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    minBathrooms: minBathrooms ? Number(minBathrooms) : undefined,
    minAreaValue: minAreaValue ? Number(minAreaValue) : undefined,
    maxAreaValue: maxAreaValue ? Number(maxAreaValue) : undefined,
    areaUnit,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Search Verified Properties</h1>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g. Lahore)"
          className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
        />
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as ListingPurpose)}
          className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
        >
          <option value="">For Sale or Rent</option>
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
        <select
          value={propertyTypeSlug}
          onChange={(e) => setPropertyTypeSlug(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
        >
          <option value="">Any property type</option>
          {propertyTypes.map((type) => (
            <option key={type.slug} value={type.slug}>
              {type.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          placeholder="Bedrooms"
          className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
        />
        <input
          type="number"
          min="0"
          value={minBathrooms}
          onChange={(e) => setMinBathrooms(e.target.value)}
          placeholder="Min bathrooms"
          className="rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={minAreaValue}
            onChange={(e) => setMinAreaValue(e.target.value)}
            placeholder="Min area"
            className="w-1/3 rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          />
          <input
            type="number"
            min="0"
            value={maxAreaValue}
            onChange={(e) => setMaxAreaValue(e.target.value)}
            placeholder="Max area"
            className="w-1/3 rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          />
          <select
            value={areaUnit}
            onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
            className="w-1/3 rounded-md border border-slate-300 px-3 py-2 dark:bg-slate-900"
          >
            {AREA_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p>Loading…</p>}

      <ul className="grid gap-4 sm:grid-cols-2">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="font-medium">{listing.title}</h2>
            <p className="text-sm text-slate-500">
              {listing.propertyType?.label} · {listing.area}, {listing.city} — PKR {listing.price}
            </p>
            <p className="text-xs text-slate-400">
              {listing.bedrooms ?? '–'} bed · {listing.bathrooms ?? '–'} bath · {listing.areaValue} {listing.areaUnit}
            </p>
          </li>
        ))}
        {!isLoading && listings.length === 0 && <p className="text-slate-500">No verified listings yet.</p>}
      </ul>
    </main>
  );
}
