'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Amenity, AmenityCategory, AmenityValueType, PropertyType, PropertyTypeCategory, useTaxonomyManagementViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal, Select, Table, TableColumn, Tabs } from '@jayedaad/ui-web';

const AMENITY_CATEGORIES: AmenityCategory[] = [
  'main_features',
  'rooms',
  'business_communication',
  'community_features',
  'healthcare_recreation',
  'nearby_locations',
  'other_facilities',
];
const AMENITY_VALUE_TYPES: AmenityValueType[] = ['boolean', 'number', 'text', 'select'];

type Tab = 'categories' | 'types' | 'amenities';

export default function TaxonomyPage() {
  const vm = useTaxonomyManagementViewModel();
  const [tab, setTab] = useState<Tab>('categories');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Taxonomy</h1>
      <Tabs
        tabs={[
          { id: 'categories', label: 'Categories' },
          { id: 'types', label: 'Property Types' },
          { id: 'amenities', label: 'Amenities' },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />
      {tab === 'categories' && <CategoriesTab vm={vm} />}
      {tab === 'types' && <TypesTab vm={vm} />}
      {tab === 'amenities' && <AmenitiesTab vm={vm} />}
    </div>
  );
}

function CategoriesTab({ vm }: { vm: ReturnType<typeof useTaxonomyManagementViewModel> }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyTypeCategory | null>(null);
  const [form, setForm] = useState({ slug: '', label: '' });

  function openCreate() {
    setEditing(null);
    setForm({ slug: '', label: '' });
    setModalOpen(true);
  }

  function openEdit(c: PropertyTypeCategory) {
    setEditing(c);
    setForm({ slug: c.slug, label: c.label });
    setModalOpen(true);
  }

  function handleSave() {
    const action = editing
      ? vm.updateCategory.mutateAsync({ id: editing.id, input: form })
      : vm.createCategory.mutateAsync(form);
    action
      .then(() => {
        toast.success('Saved.');
        setModalOpen(false);
      })
      .catch(() => toast.error('Something went wrong — please try again.'));
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    vm.removeCategory.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<PropertyTypeCategory>[] = [
    { key: 'label', header: 'Label', render: (c) => c.label },
    { key: 'slug', header: 'Slug', render: (c) => c.slug },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(c.id, c.label)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>New Category</Button>
      </div>
      <Table columns={columns} rows={vm.categories} rowKey={(c) => c.id} isLoading={vm.isLoading} emptyMessage="No categories yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function TypesTab({ vm }: { vm: ReturnType<typeof useTaxonomyManagementViewModel> }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyType | null>(null);
  const [form, setForm] = useState({ slug: '', label: '', categoryId: '' });

  function openCreate() {
    setEditing(null);
    setForm({ slug: '', label: '', categoryId: vm.categories[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(t: PropertyType) {
    setEditing(t);
    const category = vm.categories.find((c) => c.slug === t.category.slug);
    setForm({ slug: t.slug, label: t.label, categoryId: category?.id ?? '' });
    setModalOpen(true);
  }

  function handleSave() {
    const action = editing
      ? vm.updatePropertyType.mutateAsync({ id: editing.id, input: form })
      : vm.createPropertyType.mutateAsync(form);
    action
      .then(() => {
        toast.success('Saved.');
        setModalOpen(false);
      })
      .catch(() => toast.error('Something went wrong — please try again.'));
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    vm.removePropertyType.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<PropertyType>[] = [
    { key: 'label', header: 'Label', render: (t) => t.label },
    { key: 'category', header: 'Category', render: (t) => t.category.label },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(t.id, t.label)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>New Property Type</Button>
      </div>
      <Table columns={columns} rows={vm.propertyTypes} rowKey={(t) => t.id} isLoading={vm.isLoading} emptyMessage="No property types yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Property Type' : 'New Property Type'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}>
              {vm.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function AmenitiesTab({ vm }: { vm: ReturnType<typeof useTaxonomyManagementViewModel> }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [form, setForm] = useState<{ slug: string; label: string; category: AmenityCategory; valueType: AmenityValueType }>({
    slug: '',
    label: '',
    category: 'main_features',
    valueType: 'boolean',
  });

  function openCreate() {
    setEditing(null);
    setForm({ slug: '', label: '', category: 'main_features', valueType: 'boolean' });
    setModalOpen(true);
  }

  function openEdit(a: Amenity) {
    setEditing(a);
    setForm({ slug: a.slug, label: a.label, category: a.category, valueType: a.valueType });
    setModalOpen(true);
  }

  function handleSave() {
    const action = editing ? vm.updateAmenity.mutateAsync({ id: editing.id, input: form }) : vm.createAmenity.mutateAsync(form);
    action
      .then(() => {
        toast.success('Saved.');
        setModalOpen(false);
      })
      .catch(() => toast.error('Something went wrong — please try again.'));
  }

  function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    vm.removeAmenity.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  const columns: TableColumn<Amenity>[] = [
    { key: 'label', header: 'Label', render: (a) => a.label },
    { key: 'category', header: 'Category', className: 'capitalize', render: (a) => a.category.replace(/_/g, ' ') },
    { key: 'valueType', header: 'Value Type', render: (a) => a.valueType },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(a.id, a.label)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>New Amenity</Button>
      </div>
      <Table columns={columns} rows={vm.amenities} rowKey={(a) => a.id} isLoading={vm.isLoading} emptyMessage="No amenities yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Amenity' : 'New Amenity'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={form.label} onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as AmenityCategory }))}>
              {AMENITY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Value Type</Label>
            <Select value={form.valueType} onChange={(e) => setForm((prev) => ({ ...prev, valueType: e.target.value as AmenityValueType }))}>
              {AMENITY_VALUE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
