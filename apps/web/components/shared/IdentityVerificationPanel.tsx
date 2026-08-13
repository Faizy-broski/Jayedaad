'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { OwnerIdentityDocumentType, useOwnerVerificationViewModel } from '@jayedaad/core';
import { Card, CardContent } from '@jayedaad/ui-web';

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

// One shared CNIC front/back + selfie identity check for any individual —
// an owner and an independent (non-agency) agent go through the literal
// same check, not two document sets that happen to look similar. Extracted
// from apps/web/app/(agent)/submit/verify-identity/page.tsx (still the
// entry point for an owner's pre-first-listing gate) so
// apps/web/app/(buyer)/become-an-agent/page.tsx's independent-applicant
// step can render the exact same component instead of its own
// Owner ID/Company Registration upload UI (which stays reserved for actual
// agencies). Mobile counterpart:
// apps/mobile/src/components/IdentityVerificationFields.tsx.
export function IdentityVerificationPanel() {
  const { verification, isLoading, uploadDocument } = useOwnerVerificationViewModel();
  const status = verification?.status ?? null;
  const uploadedTypes = new Set((verification?.documents ?? []).map((d) => d.documentType));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          This is a one-time check — upload your CNIC (front and back) and a selfie. Our team reviews new
          submissions within 24 hours.
        </p>
        {status && (
          <p className="mt-2 text-sm">
            Status: <span className="font-medium">{STATUS_LABEL[status] ?? status}</span>
          </p>
        )}
        {status === 'rejected' && verification?.rejectionReason && (
          <p className="mt-1 text-sm text-destructive">Reason: {verification.rejectionReason}</p>
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
      toast.success(`${label} uploaded — we'll review it within 24 hours.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed — please try again.');
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
        {/* Matches services/api's ALLOWED_DOCUMENT_MIME_TYPES exactly
            (documents.service.ts) — previously offered image/webp here,
            which the server has never accepted, so a WEBP pick always
            silently 400'd (the bare catch above threw its message away). */}
        <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleUpload} />
      </label>
    </div>
  );
}
