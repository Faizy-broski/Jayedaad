'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Agency, CreateAgencyInput, useAgencyManagementViewModel } from '@jayedaad/core';
import { Badge, Button, Input, Label, Modal, Table, TableColumn } from '@jayedaad/ui-web';

const EMPTY_FORM: CreateAgencyInput = { name: '', slug: '', description: '', phone: '', email: '', city: '', address: '' };

export default function AgenciesPage() {
  const { agencies, isLoading, create, update, setVerificationStatus, remove } = useAgencyManagementViewModel();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState<CreateAgencyInput>(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(agency: Agency) {
    setEditing(agency);
    setForm({
      name: agency.name,
      slug: agency.slug,
      description: agency.description ?? '',
      phone: agency.phone ?? '',
      email: agency.email ?? '',
      city: agency.city ?? '',
      address: agency.address ?? '',
      businessHours: agency.businessHours ?? '',
      logoUrl: agency.logoUrl ?? '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (editing) {
      update.mutate(
        { id: editing.id, input: form },
        {
          onSuccess: () => {
            toast.success('Agency updated.');
            setModalOpen(false);
          },
          onError: () => toast.error('Something went wrong — please try again.'),
        },
      );
    } else {
      create.mutate(form, {
        onSuccess: () => {
          toast.success('Agency created.');
          setModalOpen(false);
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      });
    }
  }

  function handleVerify(id: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { id, input: { status } },
      {
        onSuccess: () => toast.success(`Agency ${status}.`),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Agency deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<Agency>[] = [
    { key: 'name', header: 'Name', render: (a) => a.name },
    { key: 'city', header: 'City', render: (a) => a.city ?? '—' },
    { key: 'phone', header: 'Phone', render: (a) => a.phone ?? '—' },
    {
      key: 'status',
      header: 'Verification',
      render: (a) => (
        <Badge variant={a.verificationStatus === 'verified' ? 'success' : a.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {a.verificationStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          {a.verificationStatus !== 'verified' && (
            <Button size="sm" variant="outline" onClick={() => handleVerify(a.id, 'verified')}>
              Verify
            </Button>
          )}
          {a.verificationStatus !== 'rejected' && (
            <Button size="sm" variant="outline" onClick={() => handleVerify(a.id, 'rejected')}>
              Reject
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(a.id, a.name)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agencies</h1>
        <Button onClick={openCreate}>New Agency</Button>
      </div>

      <Table columns={columns} rows={agencies} rowKey={(a) => a.id} isLoading={isLoading} emptyMessage="No agencies yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Agency' : 'New Agency'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                disabled={!!editing}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
