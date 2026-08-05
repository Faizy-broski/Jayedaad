'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Amenity, AmenityCategory, AmenityValueType, PropertyType, PropertyTypeCategory, useTaxonomyManagementViewModel } from '@jayedaad/core';
import { Button, cn, Input, Label, Modal, Select } from '@jayedaad/ui-web';
import { Home, Layers, ListTree, Pencil, PlusCircle, Search, Sparkles, Trash2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const AMENITY_CATEGORIES: AmenityCategory[] = [
  'main_features',
  'rooms',
  'business_communication',
  'community_features',
  'healthcare_recreation',
  'nearby_locations',
  'other_facilities',
  'plot_features',
];
const AMENITY_VALUE_TYPES: AmenityValueType[] = ['boolean', 'number', 'text', 'select'];

type Tab = 'categories' | 'types' | 'amenities';

// Super Admin taxonomy management — restyled to match the rest of admin
// (Agencies/Agents/Plans/Users/CRM/Listings): gradient header, animated
// stat tiles for the three catalogs, a sliding tab pill row replacing the
// plain <Tabs>, and animated card grids instead of tables. Counts are real,
// derived from the already-fetched category/type/amenity lists.
export default function TaxonomyPage() {
  const vm = useTaxonomyManagementViewModel();
  const [tab, setTab] = useState<Tab>('categories');

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'categories', label: 'Categories', count: vm.categories.length },
    { id: 'types', label: 'Property Types', count: vm.propertyTypes.length },
    { id: 'amenities', label: 'Amenities', count: vm.amenities.length },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ListTree className="h-4 w-4" />
            Platform catalog
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Taxonomy</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The categories, property types, and amenities every listing on the platform draws from.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {vm.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Layers} label="Categories" value={vm.categories.length} sub="Property groupings" />
            <StatTile index={1} icon={Home} label="Property Types" value={vm.propertyTypes.length} sub="Across all categories" />
            <StatTile index={2} icon={Sparkles} label="Amenities" value={vm.amenities.length} sub="Across all categories" />
          </>
        )}
      </div>

      <Reveal>
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="taxonomyTabPill"
                  className="bg-heading-gradient absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">
                {t.label} ({t.count})
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      {tab === 'categories' && <CategoriesTab vm={vm} />}
      {tab === 'types' && <TypesTab vm={vm} />}
      {tab === 'amenities' && <AmenitiesTab vm={vm} />}
    </div>
  );
}

function StatTile({
  index,
  icon: Icon,
  label,
  value,
  sub,
}: {
  index: number;
  icon: typeof Layers;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-3 truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <Reveal>
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
        <Icon className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>
    </Reveal>
  );
}

function TaxonomyCard({
  icon: Icon,
  title,
  badges,
  onEdit,
  onDelete,
}: {
  icon: typeof Layers;
  title: string;
  badges: { label: string; className?: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', b.className ?? 'bg-muted text-muted-foreground')}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
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
    const action = editing ? vm.updateCategory.mutateAsync({ id: editing.id, input: form }) : vm.createCategory.mutateAsync(form);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          New Category
        </button>
      </div>

      {vm.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : vm.categories.length === 0 ? (
        <EmptyState icon={Layers} label="No categories yet." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {vm.categories.map((c, index) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
              >
                <TaxonomyCard
                  icon={Layers}
                  title={c.label}
                  badges={[{ label: c.slug }]}
                  onEdit={() => openEdit(c)}
                  onDelete={() => handleDelete(c.id, c.label)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

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
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
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
    const action = editing ? vm.updatePropertyType.mutateAsync({ id: editing.id, input: form }) : vm.createPropertyType.mutateAsync(form);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          New Property Type
        </button>
      </div>

      {vm.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : vm.propertyTypes.length === 0 ? (
        <EmptyState icon={Home} label="No property types yet." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {vm.propertyTypes.map((t, index) => (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
              >
                <TaxonomyCard
                  icon={Home}
                  title={t.label}
                  badges={[{ label: t.category.label, className: 'bg-primary/10 text-primary' }]}
                  onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t.id, t.label)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

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
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AmenitiesTab({ vm }: { vm: ReturnType<typeof useTaxonomyManagementViewModel> }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ slug: string; label: string; category: AmenityCategory; valueType: AmenityValueType }>({
    slug: '',
    label: '',
    category: 'main_features',
    valueType: 'boolean',
  });

  const visibleAmenities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vm.amenities;
    return vm.amenities.filter((a) => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [vm.amenities, search]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search amenities…" className="pl-9" />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          New Amenity
        </button>
      </div>

      {vm.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : visibleAmenities.length === 0 ? (
        <EmptyState icon={Sparkles} label={search ? 'No amenities match your search.' : 'No amenities yet.'} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visibleAmenities.map((a, index) => (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
              >
                <TaxonomyCard
                  icon={Sparkles}
                  title={a.label}
                  badges={[
                    { label: a.category.replace(/_/g, ' '), className: 'bg-primary/10 text-primary' },
                    { label: a.valueType, className: 'bg-muted text-muted-foreground' },
                  ]}
                  onEdit={() => openEdit(a)}
                  onDelete={() => handleDelete(a.id, a.label)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

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
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
