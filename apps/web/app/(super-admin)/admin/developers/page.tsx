'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CreateDeveloperInput, Developer, useDevelopersViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal } from '@jayedaad/ui-web';
import { Building2, MapPin, MessageCircle, Pencil, Phone, PhoneCall, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const EMPTY_FORM: CreateDeveloperInput = { name: '', slug: '', description: '', phone: '', whatsapp: '', city: '' };

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// Real counts derived from the fetched developers list — same "compute from
// what's already loaded" approach as Agencies/Agents/Users.
export default function DevelopersPage() {
  const { developers, isLoading, create, update, remove } = useDevelopersViewModel();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState<CreateDeveloperInput>(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const cities = new Set(developers.map((d) => d.city).filter((c): c is string => !!c));
    const reachable = developers.filter((d) => d.phone || d.whatsapp).length;
    return { total: developers.length, cities: cities.size, reachable };
  }, [developers]);

  const visibleDevelopers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return developers;
    return developers.filter((d) => d.name.toLowerCase().includes(q) || (d.city ?? '').toLowerCase().includes(q));
  }, [developers, search]);

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

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Developer management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Developers</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.total}</span> developer {stats.total === 1 ? 'company' : 'companies'} across{' '}
              <span className="font-semibold text-foreground">{stats.cities}</span> {stats.cities === 1 ? 'city' : 'cities'}.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New Developer
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />)
        ) : (
          <>
            <StatTile index={0} icon={Building2} label="Total Developers" value={stats.total} sub="All registered" />
            <StatTile index={1} icon={MapPin} label="Cities Covered" value={stats.cities} sub="Unique locations" />
            <StatTile index={2} icon={PhoneCall} label="Reachable" value={stats.reachable} sub="Have a contact number" />
          </>
        )}
      </div>

      <Reveal>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city…" className="pl-9" />
        </div>
      </Reveal>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : visibleDevelopers.length === 0 ? (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No developers found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? 'Try a different search.' : 'New developer companies will appear here once added.'}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDevelopers.map((dev, index) => (
            <motion.li
              key={dev.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.05 }}
            >
              <div className="flex h-full flex-col rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {dev.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dev.logoUrl} alt={dev.name} className="h-full w-full object-cover" />
                    ) : (
                      initials(dev.name) || <Building2 className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{dev.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{dev.slug}</p>
                  </div>
                </div>

                <div className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {dev.city ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {dev.phone ?? '—'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    {dev.whatsapp ?? '—'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(dev)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={() => handleDelete(dev.id, dev.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

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
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
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
  icon: typeof Building2;
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
