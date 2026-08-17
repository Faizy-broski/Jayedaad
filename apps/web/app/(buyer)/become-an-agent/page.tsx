'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  agenciesRepository,
  OnboardingDocumentType,
  PAKISTAN_CITIES,
  useAgentApplicationViewModel,
  useAgentProfileViewModel,
  useAuthViewModel,
  useOwnerVerificationViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, Input, Label, Select } from '@jayedaad/ui-web';
import { IdentityVerificationPanel } from '@/components/shared/IdentityVerificationPanel';

// Owner ID + Company Registration are mandatory (Document Verification
// spec) — tax_certificate remains a valid upload type but is optional,
// no longer part of REQUIRED_ONBOARDING_DOCUMENT_TYPES server-side.
const DOCUMENT_TYPES: { type: OnboardingDocumentType; label: string }[] = [
  { type: 'owner_id_card', label: 'Owner ID Card (front and back)' },
  { type: 'company_registration', label: 'Company Registration ID' },
  { type: 'tax_certificate', label: 'Tax Certificate (optional)' },
];
const REQUIRED_ONBOARDING_DOCUMENT_TYPES: OnboardingDocumentType[] = ['owner_id_card', 'company_registration'];

// Self-service agent application — a logged-in buyer applies here, lands in
// the same 'pending' review queue a super_admin-created agent would (see
// apps/web/app/(verification)/agent-verification/page.tsx). Mirrors
// Zameen.com's self-register-then-review model for individual agents.
export default function BecomeAnAgentPage() {
  const { role, agentId } = useAuthViewModel();
  const { apply } = useAgentApplicationViewModel();
  const [form, setForm] = useState({ displayName: '', phone: '', city: '' });

  function handleApply() {
    apply.mutate(form, {
      onSuccess: () => toast.success('Application submitted — under review.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  // After a successful apply, refreshSession() updates role/agentId from the
  // JWT — role flips from 'buyer' to 'agent' without needing to sign out.
  if (role === 'agent' && agentId) {
    return <DocumentUploadStep agentId={agentId} />;
  }

  if (role && role !== 'buyer') {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-muted-foreground">
        This application is only available for buyer accounts.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Become an Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply to list properties as an agent. Your application is reviewed before you can start listing.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}>
              <option value="">Select City</option>
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleApply} disabled={apply.isPending}>
            {apply.isPending ? 'Submitting…' : 'Submit Application'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Branches on profile.agency: an agency-registered admin uploads the
// AGENCY's documents (Owner ID Card + Company Registration — the agency's
// own verification covers its staff, unchanged). An independent applicant
// goes through the same CNIC+selfie identity check an owner does
// (IdentityVerificationPanel, shared with /submit/verify-identity) instead
// of a separate "agent onboarding" document set — see
// services/api/src/agents/agents.repository.ts::setVerificationStatus,
// which now gates independent-agent approval on owner_identity_verifications.
function DocumentUploadStep({ agentId }: { agentId: string }) {
  const { profile } = useAgentProfileViewModel();

  if (profile?.agency) {
    return <AgencyDocumentUploadStep agencyId={profile.agency.id} status={profile.agency.verificationStatus} rejectionReason={profile.agency.rejectionReason} />;
  }

  return <IndependentAgentIdentityStep />;
}

function AgencyDocumentUploadStep({
  agencyId,
  status,
  rejectionReason,
}: {
  agencyId: string;
  status: string;
  rejectionReason: string | null;
}) {
  const router = useRouter();

  // Fetched from the server (not tracked locally per-row) — a returning
  // visitor to this page (it stays reachable as long as role stays
  // 'agent') previously saw every row reset to "not uploaded" even if the
  // documents were already there, since state lived only in each
  // DocumentRow's own useState.
  const [uploadedTypes, setUploadedTypes] = useState<Set<OnboardingDocumentType>>(new Set());
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  useEffect(() => {
    agenciesRepository
      .listDocuments(agencyId)
      .then((docs) => setUploadedTypes(new Set(docs.map((d) => d.documentType))))
      .catch(() => undefined)
      .finally(() => setIsLoadingDocs(false));
  }, [agencyId]);

  const isComplete = REQUIRED_ONBOARDING_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Application Submitted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your agency is <span className="font-medium">{status ?? 'pending'}</span>. Owner ID and Company Registration
          are required before you can continue — our team reviews everything once uploaded.
        </p>
        {status === 'rejected' && rejectionReason && <p className="mt-2 text-sm text-destructive">Reason: {rejectionReason}</p>}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow
              key={doc.type}
              agencyId={agencyId}
              documentType={doc.type}
              label={doc.label}
              uploaded={uploadedTypes.has(doc.type)}
              onUploaded={() => setUploadedTypes((prev) => new Set(prev).add(doc.type))}
            />
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" disabled={!isComplete || isLoadingDocs} onClick={() => router.push('/dashboard')}>
        {isComplete ? 'Continue to Dashboard' : 'Upload Owner ID and Company Registration to continue'}
      </Button>
    </div>
  );
}

const REQUIRED_IDENTITY_DOCUMENT_TYPES = ['cnic_front', 'cnic_back', 'selfie'] as const;

function IndependentAgentIdentityStep() {
  const router = useRouter();
  const { verification, isLoading } = useOwnerVerificationViewModel();
  const uploadedTypes = new Set((verification?.documents ?? []).map((d) => d.documentType));
  const isComplete = REQUIRED_IDENTITY_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Application Submitted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your application is under review. Verify your identity below — our team reviews everything once uploaded.
        </p>
      </div>

      <IdentityVerificationPanel />

      <Button className="w-full" disabled={!isComplete || isLoading} onClick={() => router.push('/dashboard')}>
        {isComplete ? 'Continue to Dashboard' : 'Upload your CNIC and selfie to continue'}
      </Button>
    </div>
  );
}

function DocumentRow({
  agencyId,
  documentType,
  label,
  uploaded,
  onUploaded,
}: {
  agencyId: string;
  documentType: OnboardingDocumentType;
  label: string;
  uploaded: boolean;
  onUploaded: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await agenciesRepository.uploadDocument(agencyId, documentType, file);
      onUploaded();
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
