'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { AdminUser, CreateUserInput, Role, useUserManagementViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal, Select, Table, TableColumn } from '@jayedaad/ui-web';

const ROLES: Role[] = ['super_admin', 'verification_staff', 'agent', 'buyer', 'owner'];
const EMPTY_FORM: CreateUserInput = { email: '', password: '', role: 'buyer', displayName: '' };

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const { users, isLoading, create, updateRole, suspend, unsuspend, remove } = useUserManagementViewModel(
    roleFilter ? { roles: [roleFilter as Role] } : {},
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(EMPTY_FORM);

  function handleCreate() {
    create.mutate(form, {
      onSuccess: () => {
        toast.success('User created.');
        setModalOpen(false);
        setForm(EMPTY_FORM);
      },
      onError: () => toast.error('Something went wrong — please try again.'),
    });
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

  const columns: TableColumn<AdminUser>[] = [
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'name', header: 'Name', render: (u) => u.displayName ?? '—' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Select className="h-8 w-40 py-0 text-xs" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      ),
    },
    { key: 'created', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => handleSuspendToggle(u, false)}>
            Suspend
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleSuspendToggle(u, true)}>
            Unsuspend
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(u.id, u.email)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-48">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Button onClick={() => setModalOpen(true)}>New User</Button>
        </div>
      </div>

      <Table columns={columns} rows={users} rowKey={(u) => u.id} isLoading={isLoading} emptyMessage="No users." />

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
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
