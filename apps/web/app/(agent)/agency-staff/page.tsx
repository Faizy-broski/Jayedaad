'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AgencyStaffMember, CreateAgencyStaffInput, useAgencyStaffViewModel, useAgentProfileViewModel } from '@jayedaad/core';
import { Badge, Button, Input, Label, Modal, Table, TableColumn } from '@jayedaad/ui-web';

const EMPTY_FORM: CreateAgencyStaffInput = { email: '', password: '', displayName: '' };

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
    { key: 'name', header: 'Name', render: (a) => a.displayName ?? '—' },
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
