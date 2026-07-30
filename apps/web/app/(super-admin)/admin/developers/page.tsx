'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CreateDeveloperInput, Developer, useDevelopersViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal, Table, TableColumn } from '@jayedaad/ui-web';

const EMPTY_FORM: CreateDeveloperInput = { name: '', slug: '', description: '', phone: '', whatsapp: '', city: '' };

export default function DevelopersPage() {
  const { developers, isLoading, create, update, remove } = useDevelopersViewModel();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState<CreateDeveloperInput>(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(dev: Developer) {
    setEditing(dev);
    setForm({
      name: dev.name,
      slug: dev.slug,
      description: dev.description ?? '',
      phone: dev.phone ?? '',
      whatsapp: dev.whatsapp ?? '',
      city: dev.city ?? '',
    });
    setModalOpen(true);
  }

  function handleSave() {
    const action = editing ? update.mutateAsync({ id: editing.id, input: form }) : create.mutateAsync(form);
    action
      .then(() => {
        toast.success('Saved.');
        setModalOpen(false);
      })
      .catch(() => toast.error('Something went wrong — please try again.'));
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<Developer>[] = [
    { key: 'name', header: 'Name', render: (d) => d.name },
    { key: 'city', header: 'City', render: (d) => d.city ?? '—' },
    { key: 'phone', header: 'Phone', render: (d) => d.phone ?? '—' },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (d) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(d.id, d.name)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Developers</h1>
        <Button onClick={openCreate}>New Developer</Button>
      </div>

      <Table columns={columns} rows={developers} rowKey={(d) => d.id} isLoading={isLoading} emptyMessage="No developers yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Developer' : 'New Developer'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} disabled={!!editing} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Whatsapp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
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
