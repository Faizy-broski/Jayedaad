'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { OwnerIdentityDocumentType, useOwnerVerificationViewModel } from '@jayedaad/core';
import { Button, Card, CardContent } from '@jayedaad/ui-web';

const DOCUMENT_TYPES: { type: OwnerIdentityDocumentType; label: string }[] = [
  { type: 'cnic_front', label: 'CNIC (Front)' },
  { type: 'cnic_back', label: 'CNIC (Back)' },
  { type: 'selfie', label: 'Selfie' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'pending review',
  verified: 'verified',
  rejected: 'rejected — please re-upload and try again',
};

// One-time identity check for individual owners (CNIC front/back + selfie),
// staff-reviewed same as agent verification — web counterpart to
// apps/mobile's OwnerIdentityVerificationScreen.tsx (Document Verification
// Phase 1, backfilled onto web in Phase 4 alongside the categorized media
// rebuild). Reached from /submit's gate card before a fresh owner can post
// their first listing.
export default function VerifyIdentityPage() {
  const router = useRouter();
  const { verification, isLoading, uploadDocument } = useOwnerVerificationViewModel();
  const status = verification?.status ?? null;
  const uploadedTypes = new Set((verification?.documents ?? []).map((d) => d.documentType));

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Verify Your Identity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is a one-time check — upload your CNIC (front and back) and a selfie. Our team reviews new
          submissions within 24 hours; you can post your first listing once you&apos;re verified.
        </p>
        {status && (
          <p className="mt-2 text-sm">
            Status: <span className="font-medium">{STATUS_LABEL[status] ?? status}</span>
          </p>
        )}
      </div>

      {!isLoading && (
        <Card>
          <CardContent className="space-y-4 p-6">
            {DOCUMENT_TYPES.map((doc) => (
              <DocumentRow
                key={doc.type}
                documentType={doc.type}
                label={doc.label}
                uploaded={uploadedTypes.has(doc.type)}
                onUpload={(file) => uploadDocument.mutateAsync({ documentType: doc.type, file })}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={() => router.push('/submit')}>
        Back
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
  documentType: OwnerIdentityDocumentType;
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
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  );
}
