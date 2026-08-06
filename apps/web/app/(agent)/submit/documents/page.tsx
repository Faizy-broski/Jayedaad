'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ListingDocumentType, listingsRepository } from '@jayedaad/core';
import { Button, Card, CardContent } from '@jayedaad/ui-web';

const DOCUMENT_TYPES: { type: ListingDocumentType; label: string }[] = [
  { type: 'ownership_proof', label: 'Ownership Document' },
  { type: 'utility_bill', label: 'Utility Bill' },
];

// Reached from two places: property-management/page.tsx's "Documents"
// re-entry button (any status), and its "Submit" action on a draft whose
// documents are still incomplete (see submitOnComplete below) — the full
// /submit wizard now collects these documents inline as its own step, so
// this page only matters for a listing that already exists outside that
// wizard. Web counterpart to apps/mobile's ListingDocumentsScreen.tsx.
// Only individual owners are ever routed here — agents are exempt.
export default function SubmitDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  // Set when reached from property-management's one-click "Submit" on a
  // draft — once both documents are uploaded, "Done" also has to actually
  // move the listing into pending_verification (submitDraft), not just
  // navigate away, since that transition never happened yet for this path.
  const submitOnComplete = searchParams.get('submitOnComplete') === '1';
  const [uploadedTypes, setUploadedTypes] = useState<Set<ListingDocumentType>>(new Set());
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    listingsRepository
      .listDocuments(listingId)
      .then((docs) => setUploadedTypes(new Set(docs.map((d) => d.documentType))))
      .catch(() => undefined);
  }, [listingId]);

  const isComplete = DOCUMENT_TYPES.every((doc) => uploadedTypes.has(doc.type));

  if (!listingId) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-muted-foreground">
        Missing listing — go back to{' '}
        <button className="text-primary underline" onClick={() => router.push('/property-management')}>
          My Properties
        </button>
        .
      </div>
    );
  }

  async function handleDone() {
    if (!listingId) return;
    if (!submitOnComplete) {
      router.push('/property-management');
      return;
    }
    setIsFinishing(true);
    try {
      await listingsRepository.submitDraft(listingId);
      toast.success('Submitted for verification.');
      router.push('/property-management');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong — please try again.');
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Ownership Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload proof of ownership so our team can verify this listing. Both documents are required before this
          listing can be submitted for review.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow
              key={doc.type}
              documentType={doc.type}
              label={doc.label}
              uploaded={uploadedTypes.has(doc.type)}
              onUpload={async (file) => {
                await listingsRepository.uploadDocument(listingId, doc.type, file);
                setUploadedTypes((prev) => new Set(prev).add(doc.type));
              }}
            />
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" disabled={!isComplete || isFinishing} onClick={handleDone}>
        {isFinishing ? 'Submitting…' : isComplete ? 'Done' : 'Upload both documents to continue'}
      </Button>
    </div>
  );
}

function DocumentRow({
  documentType,
  label,
  uploaded,
  onUpload,
}: {
  documentType: ListingDocumentType;
  label: string;
  uploaded: boolean;
  onUpload: (file: File) => Promise<unknown>;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {uploaded && <p className="text-xs text-primary">Uploaded</p>}
      </div>
      <label className="cursor-pointer rounded-md border border-dashed border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
        {isUploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  );
}
