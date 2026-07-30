'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  agenciesRepository,
  agentsRepository,
  PAKISTAN_CITIES,
  useAgentApplicationViewModel,
  useAgentProfileViewModel,
  useAuthViewModel,
} from '@jayedaad/core';
import { Button, Card, CardContent, Input, Label, Select } from '@jayedaad/ui-web';

const DOCUMENT_TYPES: { type: 'company_registration' | 'owner_id_card' | 'tax_certificate'; label: string }[] = [
  { type: 'owner_id_card', label: 'ID Card (front and back)' },
  { type: 'company_registration', label: 'Company Registration (if applicable)' },
  { type: 'tax_certificate', label: 'Tax Certificate' },
];

// Self-service agent application — a logged-in buyer applies here, lands in
// the same 'pending' review queue a super_admin-created agent would (see
// apps/web/app/(admin)/agent-verification/page.tsx). Mirrors Zameen.com's
// self-register-then-review model for individual agents.
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

function DocumentUploadStep({ agentId }: { agentId: string }) {
  const { profile } = useAgentProfileViewModel();
  // An agency-registered admin uploads the AGENCY's documents (the agency's
  // own verification covers its staff — see
  // services/api/src/agents/agents.repository.ts::setVerificationStatus,
  // which only requires an independent agent's own documents when
  // agency_id is null). An independent applicant uploads their own.
  const scope: { type: 'agency' | 'agent'; id: string } = profile?.agency
    ? { type: 'agency', id: profile.agency.id }
    : { type: 'agent', id: agentId };
  const status = profile?.agency ? profile.agency.verificationStatus : profile?.verificationStatus;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Application Submitted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.agency ? 'Your agency' : 'Your application'} is <span className="font-medium">{status ?? 'pending'}</span>.
          Upload the documents below so our team can review and approve your account.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {DOCUMENT_TYPES.map((doc) => (
            <DocumentRow key={doc.type} scope={scope} documentType={doc.type} label={doc.label} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentRow({
  scope,
  documentType,
  label,
}: {
  scope: { type: 'agency' | 'agent'; id: string };
  documentType: 'company_registration' | 'owner_id_card' | 'tax_certificate';
  label: string;
}) {
  const [uploaded, setUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const repository = scope.type === 'agency' ? agenciesRepository : agentsRepository;
      await repository.uploadDocument(scope.id, documentType, file);
      setUploaded(true);
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
