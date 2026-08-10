'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { agentsRepository, OnboardingDocument, OnboardingDocumentType } from '@jayedaad/core';
import { CheckCircle2, Download, UploadCloud } from 'lucide-react';

// Same set required for an independent agent's own onboarding (agents.repository.ts's
// getDocumentCompleteness) — an agency-affiliated agent is covered by the
// agency's own documents instead.
const DOCUMENT_TYPES: { type: OnboardingDocumentType; label: string }[] = [
  { type: 'owner_id_card', label: "Owner's ID Card" },
  { type: 'company_registration', label: 'Company Registration' },
  { type: 'tax_certificate', label: 'Tax Certificate (optional)' },
];

// Two modes in one component, same pattern as admin/agencies/page.tsx's
// AgencyDocumentsSection: with an agentId (editing an existing agent, e.g.
// admin/agents/page.tsx's "Documents" button), files upload immediately.
// Without one (creating a brand-new agent, e.g. admin/users/page.tsx's "New
// User" modal with role=agent), file picks are just reported up to the
// parent's pendingDocs state via onPendingFileChange — the parent uploads
// them right after the agent is actually created.
export function AgentDocumentsSection({
  agentId,
  pendingDocs,
  onPendingFileChange,
  bordered = true,
}: {
  agentId?: string;
  pendingDocs: Partial<Record<OnboardingDocumentType, File>>;
  onPendingFileChange: (type: OnboardingDocumentType, file: File) => void;
  /** false when standing alone in its own modal (the Documents button)
   * rather than tacked onto the bottom of a New/Edit Agent form. */
  bordered?: boolean;
}) {
  const queryClient = useQueryClient();
  const queryKey = ['admin', 'agents', agentId, 'documents'];

  const { data: documents, isLoading } = useQuery({
    queryKey,
    queryFn: () => agentsRepository.listDocuments(agentId!),
    enabled: !!agentId,
  });

  // `url` is a signed URL good for 1 hour (agents.repository.ts::
  // listDocuments re-signs it fresh on every call) — keyed by documentType
  // here so a re-uploaded doc's row always links to the latest file, not a
  // stale one from an earlier fetch.
  //
  // listDocuments returns every historical row (newest first) since replace
  // inserts rather than overwrites — take the first (newest) row per type,
  // not `new Map(entries)`'s last-one-wins, which would keep the oldest.
  const docByType = new Map<OnboardingDocumentType, OnboardingDocument>();
  for (const d of documents ?? []) {
    if (!docByType.has(d.documentType)) docByType.set(d.documentType, d);
  }

  return (
    <div className={bordered ? 'space-y-3 border-t border-border pt-4' : 'space-y-3'}>
      <p className="text-xs text-muted-foreground">Owner ID Card and Company Registration are required before this agent can be verified.</p>
      {agentId && isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        DOCUMENT_TYPES.map((doc) => (
          <AgentDocumentRow
            key={doc.type}
            agentId={agentId}
            documentType={doc.type}
            label={doc.label}
            document={docByType.get(doc.type)}
            pendingFile={pendingDocs[doc.type]}
            onUploaded={() => queryClient.invalidateQueries({ queryKey })}
            onPendingFileChange={onPendingFileChange}
          />
        ))
      )}
    </div>
  );
}

function AgentDocumentRow({
  agentId,
  documentType,
  label,
  document,
  pendingFile,
  onUploaded,
  onPendingFileChange,
}: {
  agentId?: string;
  documentType: OnboardingDocumentType;
  label: string;
  document: OnboardingDocument | undefined;
  pendingFile: File | undefined;
  onUploaded: () => void;
  onPendingFileChange: (type: OnboardingDocumentType, file: File) => void;
}) {
  const uploaded = !!document;
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!agentId) {
      onPendingFileChange(documentType, file);
      return;
    }

    setIsUploading(true);
    try {
      await agentsRepository.uploadDocument(agentId, documentType, file);
      onUploaded();
      toast.success(`${label} uploaded.`);
    } catch {
      toast.error('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  const isDone = uploaded || !!pendingFile;
  const actionLabel = isUploading ? 'Uploading…' : pendingFile ? 'Change' : isDone ? 'Replace' : 'Upload';

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
        {!uploaded && pendingFile && <span className="text-xs text-muted-foreground">Uploads when you save</span>}
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
          {actionLabel}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
}
