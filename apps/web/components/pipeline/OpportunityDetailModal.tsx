'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Opportunity, OpportunityStage, OPPORTUNITY_STAGE_TRANSITIONS, useOpportunityPipelineViewModel, useFormattedPrice } from '@jayedaad/core';
import { Badge, Modal, Select } from '@jayedaad/ui-web';
import { History, PlusCircle } from 'lucide-react';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { LogActivityModal } from '@/components/crm/LogActivityModal';
import { LogLostReasonModal } from './LogLostReasonModal';

const STAGE_LABEL: Record<string, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

// Opened from a Kanban card. Stage changes can also be made here via a
// plain <Select> — the board's only OTHER way to change stage is pointer
// drag-and-drop (dnd-kit, PointerSensor), which a keyboard-only or
// assistive-tech user has no way to perform at all; this control needs no
// drag support whatsoever, same accessible pattern crm/page.tsx already
// uses for lead status.
export function OpportunityDetailModal({ opportunity, onClose }: { opportunity: Opportunity | null; onClose: () => void }) {
  const { format: formatPrice } = useFormattedPrice();
  const { updateStage } = useOpportunityPipelineViewModel({}, { enabled: false });
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [pendingLostStage, setPendingLostStage] = useState(false);

  if (!opportunity) return null;

  const validTargets = OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage];
  const isTerminal = validTargets.length === 0;

  function changeStage(toStage: OpportunityStage, lostReason?: string) {
    if (!opportunity) return;
    updateStage.mutate(
      { id: opportunity.id, input: { toStage, lostReason } },
      {
        onSuccess: () => {
          toast.success(`Moved to ${toStage.replace('_', ' ')}.`);
          setPendingLostStage(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  return (
    <Modal open={!!opportunity} onClose={onClose} title={opportunity.name}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isTerminal ? (
            <Badge variant="default">{STAGE_LABEL[opportunity.stage] ?? opportunity.stage}</Badge>
          ) : (
            <Select
              value={opportunity.stage}
              disabled={updateStage.isPending}
              onChange={(e) => {
                const toStage = e.target.value as OpportunityStage;
                if (toStage === opportunity.stage) return;
                if (toStage === 'lost') {
                  setPendingLostStage(true);
                  return;
                }
                changeStage(toStage);
              }}
              className="h-8 w-auto rounded-full px-3 text-xs"
            >
              <option value={opportunity.stage}>{STAGE_LABEL[opportunity.stage] ?? opportunity.stage}</option>
              {validTargets.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABEL[stage]}
                </option>
              ))}
            </Select>
          )}
          <span className="text-xs text-muted-foreground">{opportunity.probability}% probability</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="font-semibold text-foreground">{formatPrice(opportunity.value)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expected Close</p>
            <p className="font-semibold text-foreground">
              {new Date(opportunity.expectedCloseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {opportunity.lostReason && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="font-medium">Lost reason:</span> {opportunity.lostReason}
          </p>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <History className="h-3.5 w-3.5" />
              Activity
            </p>
            <button
              type="button"
              onClick={() => setLogActivityOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Log Activity
            </button>
          </div>
          <div className="mt-2">
            <ActivityTimeline opportunityId={opportunity.id} />
          </div>
        </div>
      </div>

      <LogActivityModal open={logActivityOpen} onClose={() => setLogActivityOpen(false)} opportunityId={opportunity.id} />

      <LogLostReasonModal
        open={pendingLostStage}
        onClose={() => setPendingLostStage(false)}
        isPending={updateStage.isPending}
        onConfirm={(reason) => changeStage('lost', reason)}
      />
    </Modal>
  );
}
