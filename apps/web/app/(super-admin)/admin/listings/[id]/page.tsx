'use client';

import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ListingStatus, formatPrice, useAdminListingDetailViewModel } from '@jayedaad/core';
import { Badge, Button, Card, CardContent, Select } from '@jayedaad/ui-web';

const OVERRIDE_STATUSES: ListingStatus[] = [
  'pending_verification',
  'verified',
  'rejected',
  'expired',
  'downgraded',
  'inactive',
  'deleted',
];

// Read-only listing detail for Super Admin, rendered inside the admin shell
// (apps/web/app/(super-admin)/layout.tsx) — deliberately NOT a link into
// /submit's edit form, which lives under the agent route group and renders
// the agent Profolio shell instead.
export default function AdminListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { listing, isLoading, setStatus } = useAdminListingDetailViewModel(params.id);

  function handleOverride(next: ListingStatus) {
    setStatus.mutate(
      { status: next },
      {
        onSuccess: () => toast.success('Listing status updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!listing) return <p className="text-sm text-muted-foreground">Listing not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <h1 className="mt-1 text-2xl font-semibold">{listing.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{listing.status}</Badge>
          <Select
            className="h-9 w-48"
            value=""
            onChange={(e) => handleOverride(e.target.value as ListingStatus)}
            disabled={setStatus.isPending}
          >
            <option value="">Override status…</option>
            {OVERRIDE_STATUSES.filter((s) => s !== listing.status).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {listing.media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {listing.media.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={m.compressedUrl ?? m.url} alt="" className="h-32 w-full rounded-md object-cover" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Price" value={formatPrice(Number(listing.price))} />
              <Field label="Purpose" value={listing.purpose} />
              <Field label="City" value={listing.city} />
              <Field label="Area" value={listing.area} />
              <Field label="Bedrooms" value={listing.bedrooms ?? '—'} />
              <Field label="Bathrooms" value={listing.bathrooms ?? '—'} />
              <Field label="Size" value={listing.areaValue ? `${listing.areaValue} ${listing.areaUnit}` : '—'} />
              <Field label="Furnishing" value={listing.furnishingStatus ?? '—'} />
              <Field label="Listed" value={new Date(listing.createdAt).toLocaleDateString()} />
            </div>
            {listing.description && (
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</h3>
                <p className="text-sm">{listing.description}</p>
              </div>
            )}
            {listing.amenities.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <Badge key={a.slug}>{a.label}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Listed By</h3>
              <p className="text-sm">{listing.agent?.displayName ?? 'Owner-listed'}</p>
              {listing.agent?.agency && <p className="text-xs text-muted-foreground">{listing.agent.agency.name}</p>}
            </div>
            {listing.contactNumbers.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</h3>
                {listing.contactNumbers.map((c, i) => (
                  <p key={i} className="text-sm">
                    {c.type}: {c.countryCode} {c.number}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  );
}
