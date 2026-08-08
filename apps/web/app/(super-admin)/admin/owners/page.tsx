'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  OwnerIdentityDocument,
  OwnerIdentityDocumentType,
  ownersRepository,
  PendingOwnerVerification,
  useAdminOwnersViewModel,
} from '@jayedaad/core';
import { Badge, Button, Modal, Table, TableColumn } from '@jayedaad/ui-web';
import { CheckCircle2, Download, FileCheck2, UploadCloud } from 'lucide-react';

const OWNER_DOCUMENT_TYPES: { type: OwnerIdentityDocumentType; label: string }[] = [
  { type: 'cnic_front', label: 'CNIC — Front' },
  { type: 'cnic_back', label: 'CNIC — Back' },
  { type: 'selfie', label: 'Selfie' },
];

// Staff review queue for the one-time owner identity verification
// (CNIC front/back + selfie) — mirrors admin/agents/page.tsx's Verify/Reject
// action exactly. Only ever shows still-'pending' rows, same scope as
// GET /owners/pending-verification server-side.
export default function OwnersPage() {
  const { owners, isLoading, setVerificationStatus } = useAdminOwnersViewModel();
  const [docsModalOwner, setDocsModalOwner] = useState<PendingOwnerVerification | null>(null);

  function handleVerify(userId: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { userId, status },
      {
        onSuccess: () => toast.success(`Owner ${status}.`),
        // Same convention as admin/agents/page.tsx's handleVerify — the
        // API's 400 here is a real, specific reason (missing CNIC/selfie),
        // surface it instead of a generic message.
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<PendingOwnerVerification>[] = [
    { key: 'name', header: 'Owner', render: (o) => o.displayName ?? '—' },
    { key: 'email', header: 'Email', render: (o) => o.email ?? '—' },
    {
      key: 'documents',
      header: 'Documents',
      render: (o) => `${o.documents.uploaded.length} / ${o.documents.required.length}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <Badge variant="warning">{o.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={o.documents.missing.length > 0}
            onClick={() => handleVerify(o.userId, 'verified')}
          >
            Verify
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleVerify(o.userId, 'rejected')}>
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDocsModalOwner(o)}>
            <FileCheck2 className="mr-1 h-3.5 w-3.5" />
            Documents
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Owner Verification</h1>
        <p className="text-muted-foreground">One-time identity checks (CNIC + selfie) awaiting review.</p>
      </div>
      <Table
        columns={columns}
        rows={owners}
        rowKey={(o) => o.userId}
        isLoading={isLoading}
        emptyMessage="No owners pending verification."
      />

      {/* View the owner's actual CNIC/selfie files (signed URLs), and
          upload on their behalf if they're stuck (e.g. sent scans some
          other way) — same allowance admin/agents/page.tsx's Documents
          modal gives a Super Admin for a stuck agent. */}
      <Modal open={!!docsModalOwner} onClose={() => setDocsModalOwner(null)} title={`Documents — ${docsModalOwner?.displayName ?? ''}`}>
        {docsModalOwner && <OwnerDocumentsSection userId={docsModalOwner.userId} />}
      </Modal>
    </div>
  );
}

function OwnerDocumentsSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'owners', userId, 'documents'];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => ownersRepository.listDocuments(userId),
  });

  // `url` is a signed URL good for 1 hour (owners.repository.ts::
  // listDocumentsForAdmin re-signs it fresh on every call) — keyed by
  // documentType so a re-uploaded doc's row always links to the latest file.
  const docByType = new Map((documents ?? []).map((d) => [d.documentType, d]));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">CNIC front/back and a selfie are required before this owner can be verified.</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        OWNER_DOCUMENT_TYPES.map((doc) => (
          <OwnerDocumentRow
            key={doc.type}
            userId={userId}
            documentType={doc.type}
            label={doc.label}
            document={docByType.get(doc.type)}
            onUploaded={() => queryClient.invalidateQueries({ queryKey })}
          />
        ))
      )}
    </div>
  );
}

function OwnerDocumentRow({
  userId,
  documentType,
  label,
  document,
  onUploaded,
}: {
  userId: string;
  documentType: OwnerIdentityDocumentType;
  label: string;
  document: OwnerIdentityDocument | undefined;
  onUploaded: () => void;
}) {
  const uploaded = !!document;
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      await ownersRepository.uploadDocumentForUser(userId, documentType, file);
      onUploaded();
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {uploaded && (
          <span className="flex items-center gap-1 text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {document && (
          <a
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" />
            View
          </a>
        )}
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
          <UploadCloud className="h-3.5 w-3.5" />
          {isUploading ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleUpload} />
        </label>
      </div>
    </div>
  );
}
