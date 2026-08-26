'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveAgentDisplayName, useAgentAgencyPickerViewModel } from '@jayedaad/core';
import { cn, Input } from '@jayedaad/ui-web';
import { Building2, ChevronDown, Search, User, Users } from 'lucide-react';

export type PickerSelection = { type: 'agent' | 'agency'; id: string; label: string } | null;

const VERIFICATION_DOT: Record<string, string> = {
  verified: 'bg-emerald-500',
  pending: 'bg-amber-500',
  rejected: 'bg-red-500',
};

// Purpose-built replacement for admin/crm/page.tsx's old flat <select> —
// groups agents under their agency vs. "Independent Agents", with search,
// so Super Admin can tell agencies and agents apart at a glance (the
// literal ask). Not built on ui-web/Select.tsx: that component flattens
// <optgroup> and has no search input, both needed here.
export function AgentAgencyPicker({
  value,
  onSelect,
}: {
  value: PickerSelection;
  onSelect: (selection: PickerSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { agencyGroups, independentAgentOptions, isLoading } = useAgentAgencyPickerViewModel(search);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function pick(selection: PickerSelection) {
    onSelect(selection);
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-full border border-input bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate text-left">{value ? value.label : 'All agents'}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-background shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents or agencies…"
              className="pl-9"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => pick(null)}
              className={cn(
                'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60',
                !value && 'bg-muted/60 font-medium',
              )}
            >
              All agents
            </button>

            {isLoading && <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading…</p>}

            {!isLoading && agencyGroups.length === 0 && independentAgentOptions.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches.</p>
            )}

            {agencyGroups.length > 0 && (
              <div className="mt-1">
                <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  Agencies
                </p>
                {agencyGroups.map(({ agency, agents }) => (
                  <div key={agency.id}>
                    <button
                      type="button"
                      onClick={() => pick({ type: 'agency', id: agency.id, label: agency.name })}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60',
                        value?.type === 'agency' && value.id === agency.id && 'bg-muted/60 font-medium',
                      )}
                    >
                      <span className="truncate">{agency.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{agency.salesAssociateCount} staff</span>
                    </button>
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => pick({ type: 'agent', id: agent.id, label: resolveAgentDisplayName(agent) })}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg py-1.5 pl-8 pr-3 text-left text-sm text-foreground hover:bg-muted/60',
                          value?.type === 'agent' && value.id === agent.id && 'bg-muted/60 font-medium',
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', VERIFICATION_DOT[agent.verificationStatus] ?? 'bg-slate-400')} />
                        <span className="truncate">{resolveAgentDisplayName(agent)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {independentAgentOptions.length > 0 && (
              <div className="mt-1">
                <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Independent Agents
                </p>
                {independentAgentOptions.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => pick({ type: 'agent', id: agent.id, label: resolveAgentDisplayName(agent) })}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60',
                      value?.type === 'agent' && value.id === agent.id && 'bg-muted/60 font-medium',
                    )}
                  >
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{resolveAgentDisplayName(agent)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
