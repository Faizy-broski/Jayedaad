'use client';

import { useAdminDashboardViewModel } from '@jayedaad/core';
import { Card, CardContent, Table, TableColumn, Badge } from '@jayedaad/ui-web';
import { AgentOverview } from '@jayedaad/core';

// Super Admin landing page — platform-wide KPI rollup (GET /admin/stats)
// plus the agents overview roster (GET /admin/agents), both computed at
// query time server-side.
export default function AdminDashboardPage() {
  const { stats, isStatsLoading, agents, isAgentsLoading } = useAdminDashboardViewModel();

  const columns: TableColumn<AgentOverview>[] = [
    { key: 'name', header: 'Agent', render: (a) => a.displayName ?? '—' },
    { key: 'phone', header: 'Phone', render: (a) => a.phone ?? '—' },
    { key: 'city', header: 'City', render: (a) => a.city ?? '—' },
    { key: 'agency', header: 'Agency', render: (a) => a.agency?.name ?? 'Independent' },
    {
      key: 'verification',
      header: 'Verification',
      render: (a) => (
        <Badge variant={a.verificationStatus === 'verified' ? 'success' : a.verificationStatus === 'rejected' ? 'destructive' : 'warning'}>
          {a.verificationStatus}
        </Badge>
      ),
    },
    { key: 'plan', header: 'Plan', render: (a) => a.subscription?.tierName ?? '—' },
    { key: 'listings', header: 'Listings', render: (a) => `${a.listingCounts.verified} / ${a.listingCounts.total}` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Platform Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Users by role" data={stats?.usersByRole} isLoading={isStatsLoading} />
        <StatCard title="Agencies by status" data={stats?.agenciesByVerificationStatus} isLoading={isStatsLoading} />
        <StatCard title="Listings by status" data={stats?.listingsByStatus} isLoading={isStatsLoading} />
        <StatCard title="Leads by status" data={stats?.leadsByStatus} isLoading={isStatsLoading} />
        <StatCard title="Active subscriptions" data={stats?.activeSubscriptionsByTier} isLoading={isStatsLoading} />
      </div>

      <div>
        <h2 className="mb-4 font-medium">Agents</h2>
        <Table columns={columns} rows={agents} rowKey={(a) => a.id} isLoading={isAgentsLoading} emptyMessage="No agents yet." />
      </div>
    </div>
  );
}

function StatCard({ title, data, isLoading }: { title: string; data?: Record<string, number>; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {Object.entries(data ?? {}).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                <span className="font-semibold">{value}</span>
              </li>
            ))}
            {Object.keys(data ?? {}).length === 0 && <li className="text-muted-foreground">No data.</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
