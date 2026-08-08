'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  agentsRepository,
  AgencyStaffMember,
  CreateAgencyStaffInput,
  useAgencyStaffViewModel,
  useAgentProfileViewModel,
} from '@jayedaad/core';
import { Badge, Button, Input, Label, Modal, Table, TableColumn } from '@jayedaad/ui-web';
import { useMutation } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';

const EMPTY_FORM: CreateAgencyStaffInput = { email: '', password: '', displayName: '' };

function StaffAvatar({ photoUrl, name, size = 32 }: { photoUrl: string | null; name: string | null; size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-muted"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {(name ?? '?').charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// Agency self-management — only rendered/reachable for an agent whose own
// profile has isAgencyAdmin=true (see apps/web/app/(agent)/layout.tsx's
// NAV_ITEMS filter); the server enforces the real boundary regardless
// (agencies.controller.ts::assertCanManageStaff).
export default function AgencyStaffPage() {
  const { profile, isLoading: isProfileLoading } = useAgentProfileViewModel();
  const agencyId = profile?.agency?.id;

  const { staff, isLoading, addStaff, setStaffAdmin, removeStaff } = useAgencyStaffViewModel(agencyId ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateAgencyStaffInput>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploads immediately on pick (same UX as agent-settings' own photo
  // upload) — there's no agent id yet to attach to directly, so this hits
  // the id-less POST /agents/photo/upload and the returned url just sits in
  // form.photoUrl until "Add" is pressed.
  const uploadPhoto = useMutation({
    mutationFn: (file: File) => agentsRepository.uploadStandaloneAvatar(file),
    onSuccess: ({ url }) => setForm((prev) => ({ ...prev, photoUrl: url })),
    onError: () => toast.error('Photo upload failed — please try again.'),
  });

  if (isProfileLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!profile?.isAgencyAdmin || !agencyId) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Agency staff management is only available to an agency&apos;s admin.
      </div>
    );
  }

  function handleAdd() {
    addStaff.mutate(form, {
      onSuccess: () => {
        toast.success('Agent added.');
        setModalOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto.mutate(file);
    e.target.value = '';
  }

  function handleToggleAdmin(agentId: string, next: boolean) {
    setStaffAdmin.mutate(
      { agentId, isAgencyAdmin: next },
      {
        onSuccess: () => toast.success(next ? 'Promoted to agency admin.' : 'Admin access removed.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleRemove(agentId: string, name: string) {
    if (!confirm(`Remove "${name}" from this agency?`)) return;
    removeStaff.mutate(agentId, {
      onSuccess: () => toast.success('Agent removed from agency.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<AgencyStaffMember>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (a) => (
        <div className="flex items-center gap-2">
          <StaffAvatar photoUrl={a.photoUrl} name={a.displayName} />
          <span>{a.displayName ?? '—'}</span>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (a) => a.phone ?? '—' },
    { key: 'city', header: 'City', render: (a) => a.city ?? '—' },
    {
      key: 'verification',
      header: 'Verification',
      render: (a) => (
        <Badge variant={a.verificationStatus === 'verified' ? 'success' : a.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {a.verificationStatus}
        </Badge>
      ),
    },
    { key: 'admin', header: 'Agency Admin', render: (a) => (a.isAgencyAdmin ? <Badge variant="success">Admin</Badge> : '—') },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => handleToggleAdmin(a.id, !a.isAgencyAdmin)}>
            {a.isAgencyAdmin ? 'Revoke Admin' : 'Make Admin'}
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleRemove(a.id, a.displayName ?? 'this agent')}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agency Staff</h1>
        <Button onClick={() => setModalOpen(true)}>Add Agent</Button>
      </div>

      <Table columns={columns} rows={staff} rowKey={(a) => a.id} isLoading={isLoading} emptyMessage="No agents in this agency yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Agent">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-full"
              aria-label="Add a photo"
            >
              <StaffAvatar photoUrl={form.photoUrl ?? null} name={form.displayName ?? null} size={56} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadPhoto.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </span>
            </button>
            <p className="text-xs text-muted-foreground">Optional photo — shown in the staff list.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Temporary Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          </div>
          <Button onClick={handleAdd} disabled={addStaff.isPending}>
            {addStaff.isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
