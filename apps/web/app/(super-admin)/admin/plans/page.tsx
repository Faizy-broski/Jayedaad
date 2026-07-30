'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreateSubscriptionTierInput,
  SubscriptionTier,
  formatPrice,
  useAdminAgentsViewModel,
  usePlanManagementViewModel,
} from '@jayedaad/core';
import { Button, Input, Label, Modal, Select, Table, TableColumn } from '@jayedaad/ui-web';

const EMPTY_FORM: CreateSubscriptionTierInput = { name: '', listingQuota: 0, price: 0, analyticsDepth: {} };

export default function PlansPage() {
  const { tiers, isLoading, createTier, updateTier, removeTier, assignToAgent } = usePlanManagementViewModel();
  const { agents } = useAdminAgentsViewModel();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionTier | null>(null);
  const [form, setForm] = useState<CreateSubscriptionTierInput>(EMPTY_FORM);

  const [assignAgentId, setAssignAgentId] = useState('');
  const [assignTierId, setAssignTierId] = useState('');

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(tier: SubscriptionTier) {
    setEditing(tier);
    setForm({ name: tier.name, listingQuota: tier.listingQuota, price: tier.price, analyticsDepth: tier.analyticsDepth });
    setModalOpen(true);
  }

  function handleSave() {
    if (editing) {
      updateTier.mutate(
        { id: editing.id, input: form },
        {
          onSuccess: () => {
            toast.success('Plan updated.');
            setModalOpen(false);
          },
          onError: () => toast.error('Something went wrong — please try again.'),
        },
      );
    } else {
      createTier.mutate(form, {
        onSuccess: () => {
          toast.success('Plan created.');
          setModalOpen(false);
        },
        onError: () => toast.error('Something went wrong — please try again.'),
      });
    }
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete plan "${name}"? Agents currently on this plan will block the delete.`)) return;
    removeTier.mutate(id, {
      onSuccess: () => toast.success('Plan deleted.'),
      onError: () => toast.error('Could not delete — an agent may still be on this plan.'),
    });
  }

  function handleAssign() {
    if (!assignAgentId || !assignTierId) return;
    assignToAgent.mutate(
      { agentId: assignAgentId, input: { tierId: assignTierId } },
      {
        onSuccess: () => toast.success('Plan assigned.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  const columns: TableColumn<SubscriptionTier>[] = [
    { key: 'name', header: 'Name', render: (t) => t.name },
    { key: 'quota', header: 'Listing Quota', render: (t) => t.listingQuota },
    { key: 'price', header: 'Price', render: (t) => formatPrice(t.price) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(t.id, t.name)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <Button onClick={openCreate}>New Plan</Button>
      </div>

      <Table columns={columns} rows={tiers} rowKey={(t) => t.id} isLoading={isLoading} emptyMessage="No plans yet." />

      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 font-medium">Assign a plan to an agent</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Agent</Label>
            <Select value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)}>
              <option value="">Select agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName ?? a.id}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={assignTierId} onChange={(e) => setAssignTierId(e.target.value)}>
              <option value="">Select plan</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAssign} disabled={assignToAgent.isPending || !assignAgentId || !assignTierId}>
              {assignToAgent.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Plan' : 'New Plan'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Listing Quota</Label>
            <Input
              type="number"
              value={form.listingQuota}
              onChange={(e) => setForm((prev) => ({ ...prev, listingQuota: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
            />
          </div>
          <Button onClick={handleSave} disabled={createTier.isPending || updateTier.isPending}>
            {createTier.isPending || updateTier.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
