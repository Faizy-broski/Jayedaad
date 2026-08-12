'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AdminUser,
  agentsRepository,
  CreateUserInput,
  OnboardingDocumentType,
  PAKISTAN_CITIES,
  Role,
  useAdminStatsViewModel,
  useAgencyManagementViewModel,
  useUserManagementViewModel,
} from '@jayedaad/core';
import { Button, cn, Input, KpiCard, Label, Modal, Pagination, Select } from '@jayedaad/ui-web';
import { AgentDocumentsSection } from '@/components/agents/AgentDocumentsSection';
import {
  Ban,
  Calendar,
  Home,
  Mail,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const ROLES: Role[] = ['super_admin', 'verification_staff', 'agent', 'buyer', 'owner'];
const EMPTY_FORM: CreateUserInput = { email: '', password: '', role: 'buyer', displayName: '' };

const ROLE_FILTERS: { id: Role | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'super_admin', label: 'Admins' },
  { id: 'verification_staff', label: 'Staff' },
  { id: 'agent', label: 'Agents' },
  { id: 'buyer', label: 'Buyers' },
  { id: 'owner', label: 'Owners' },
];

const ROLE_STYLES: Record<Role, { dot: string; badge: string }> = {
  super_admin: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary' },
  verification_staff: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
  agent: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  buyer: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  owner: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
};

function roleLabel(role: Role): string {
  return role.replace('_', ' ');
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

const PAGE_SIZE = 20;

// Header stat tiles read from GET /admin/stats (true platform totals),
// not from whatever page of results happens to be loaded — same fix as
// Agencies/Agents now that the roster itself is server-side paginated,
// with search applied server-side too (same fix as CRM's search box).
export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { users, total, isLoading, isError, create, updateRole, suspend, unsuspend, remove } = useUserManagementViewModel({
    roles: roleFilter === 'all' ? undefined : [roleFilter],
    search: search.trim() || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { stats } = useAdminStatsViewModel();
  // Bounded, unpaginated-ish fetch (pageSize 100) to populate the New User
  // modal's Agency dropdown — mirrors admin/plans/page.tsx's "Assign a
  // plan" dropdown reasoning: this is a picker, not the paginated table, so
  // it needs every agency at once, not one page's worth.
  const { agencies } = useAgencyManagementViewModel({ pageSize: 100 });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(EMPTY_FORM);
  // Deferred-upload pattern (same as admin/agencies/page.tsx's New Agency
  // modal): a brand-new agent has no id to upload documents against yet, so
  // files picked while creating are held here and only actually uploaded
  // once `create` resolves and a real agentId exists.
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<OnboardingDocumentType, File>>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const byRole = stats?.usersByRole ?? {};
  const counts = {
    total,
    agent: byRole.agent ?? 0,
    buyer: byRole.buyer ?? 0,
    owner: byRole.owner ?? 0,
    super_admin: byRole.super_admin ?? 0,
    verification_staff: byRole.verification_staff ?? 0,
  };

  function handleRoleFilterChange(next: Role | 'all') {
    setRoleFilter(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setPendingDocs({});
    setModalOpen(true);
  }

  async function handleCreate() {
    try {
      const created = await create.mutateAsync(form);
      // Only agent creations can have pendingDocs (the section only renders
      // for role === 'agent'), and only once profiles.agent_id is actually
      // backfilled (users.repository.ts::create()) does `created.agentId`
      // come back non-null.
      if (created.agentId) {
        const uploads = Object.entries(pendingDocs) as [OnboardingDocumentType, File][];
        for (const [documentType, file] of uploads) {
          await agentsRepository.uploadDocument(created.agentId, documentType, file);
        }
      }
      toast.success('User created.');
      setModalOpen(false);
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  function handleRoleChange(id: string, role: Role) {
    updateRole.mutate(
      { id, input: { role } },
      {
        onSuccess: () => toast.success('Role updated.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleSuspendToggle(user: AdminUser, currentlySuspended: boolean) {
    const mutation = currentlySuspended ? unsuspend : suspend;
    mutation.mutate(user.id, {
      onSuccess: () => toast.success(currentlySuspended ? 'User unsuspended.' : 'User suspended.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  function handleDelete(id: string, email: string) {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('User deleted.'),
      onError: () => toast.error('Something went wrong — please try again.'),
    });
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              User management
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Users</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.total}</span> registered {counts.total === 1 ? 'user' : 'users'} across
              every role.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-heading-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            New User
          </button>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl border border-border bg-muted/40" />)
        ) : (
          <>
            {[
              { icon: Users, label: 'Total Users', value: counts.total, sub: 'All roles' },
              { icon: Home, label: 'Agents', value: counts.agent, sub: 'Listing on the platform' },
              { icon: UserCheck, label: 'Buyers & Owners', value: counts.buyer + counts.owner, sub: 'Demand-side users' },
              { icon: ShieldCheck, label: 'Admins & Staff', value: counts.super_admin + counts.verification_staff, sub: 'Internal team' },
            ].map((tile, index) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <KpiCard index={index} {...tile} />
              </motion.div>
            ))}
          </>
        )}
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-border bg-muted/40 p-1">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleRoleFilterChange(f.id)}
                className={cn(
                  'relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  roleFilter === f.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {roleFilter === f.id && (
                  <motion.span
                    layoutId="userRoleTab"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by email or name…" className="pl-9" />
          </div>
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {isError && (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-destructive/40 py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-destructive/50" />
            <h3 className="text-sm font-semibold text-foreground">Couldn&apos;t load users</h3>
            <p className="mt-1 text-xs text-muted-foreground">Please try again in a moment.</p>
          </div>
        </Reveal>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <Reveal>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">No users found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || roleFilter !== 'all' ? 'Try a different search or filter.' : 'New users will appear here once registered.'}
            </p>
          </div>
        </Reveal>
      )}

      {!isLoading && users.length > 0 && (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {users.map((user, index) => {
              const style = ROLE_STYLES[user.role];
              return (
                <motion.li
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {user.displayName ? initials(user.displayName) : user.email.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{user.displayName ?? 'Unnamed user'}</p>
                          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', style.badge)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                            {roleLabel(user.role)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        disabled={updateRole.isPending}
                        className="h-9 w-auto rounded-full px-3 text-xs capitalize"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => handleSuspendToggle(user, false)}>
                        <Ban className="mr-1 h-3.5 w-3.5" />
                        Suspend
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSuspendToggle(user, true)}>
                        <UserCheck className="mr-1 h-3.5 w-3.5" />
                        Unsuspend
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(user.id, user.email)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New User">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </div>

          {/* Agent-only — same fields the self-service become-an-agent flow
              collects, available up front here too (previously this modal
              left phone/city permanently null and required document upload
              for every admin-created agent, unlike self-service). */}
          {form.role === 'agent' && (
            <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={form.city ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}>
                    <option value="">Select city</option>
                    {PAKISTAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Agency (optional)</Label>
                <Select value={form.agencyId ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, agencyId: e.target.value || undefined }))}>
                  <option value="">No agency (independent)</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
              <AgentDocumentsSection
                agentId={undefined}
                pendingDocs={pendingDocs}
                onPendingFileChange={(type, file) => setPendingDocs((prev) => ({ ...prev, [type]: file }))}
                bordered={false}
              />
            </div>
          )}

          <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
