'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Opportunity, OpportunityStage, OPPORTUNITY_STAGE_TRANSITIONS, useAgentProfileViewModel, useOpportunityPipelineViewModel } from '@jayedaad/core';
import { Kanban, BarChart3 } from 'lucide-react';
import { OpportunityCard } from '@/components/pipeline/OpportunityCard';
import { OpportunityDetailModal } from '@/components/pipeline/OpportunityDetailModal';
import { LogLostReasonModal } from '@/components/pipeline/LogLostReasonModal';

// All 6 stages always get a column — won/lost previously only rendered
// behind a "Show Won/Lost" toggle defaulting to off, which meant there was
// no droppable target for them at all until a user found and clicked that
// toggle first: the single most important action on this board (closing a
// deal) was unreachable on first load. A column being "closed"/less
// actively worked isn't a reason to make it undiscoverable.
const STAGES: { id: OpportunityStage; label: string }[] = [
  { id: 'qualification', label: 'Qualification' },
  { id: 'needs_analysis', label: 'Needs Analysis' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

function KanbanColumn({
  stage,
  label,
  opportunities,
  onOpen,
}: {
  stage: OpportunityStage;
  label: string;
  opportunities: Opportunity[];
  onOpen: (opportunity: Opportunity) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{opportunities.length}</span>
      </div>
      {opportunities.length > 0 && (
        <p className="mb-2 text-[11px] text-muted-foreground">
          {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalValue)} total
        </p>
      )}
      <div className="min-h-[80px] flex-1 space-y-2">
        {opportunities.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} onOpen={onOpen} />
        ))}
        {opportunities.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No opportunities</p>}
      </div>
    </div>
  );
}

// Kanban pipeline board (Phase 3 of the CRM maturity build-out) — the
// visual centerpiece of "a real CRM," replacing the flat status list
// metaphor with a drag-to-advance board. New opportunities are always born
// either from "Convert to Opportunity" on a lead (crm/page.tsx) or created
// directly here — see the "New Opportunity" entry point, wired once the
// direct-create form exists (kept out of this pass's initial scope; the
// board itself and drag-driven stage transitions are the core deliverable).
//
// Wrapped in Suspense: useSearchParams() below requires a Suspense
// boundary above it, same convention login/page.tsx already established
// (otherwise `next build` opts the whole route out of static rendering).
export default function PipelinePage() {
  return (
    <Suspense>
      <PipelineBoard />
    </Suspense>
  );
}

function PipelineBoard() {
  const { profile } = useAgentProfileViewModel();
  const searchParams = useSearchParams();
  // Set by ConvertToOpportunityModal after a successful conversion
  // (?opportunityId=<id>) so the user lands directly on what they just
  // created instead of a bare board with no indication which card is new.
  const highlightOpportunityId = searchParams.get('opportunityId');
  const [agencyScope, setAgencyScope] = useState(false);
  const [openOpportunity, setOpenOpportunity] = useState<Opportunity | null>(null);
  const [pendingLostDrag, setPendingLostDrag] = useState<Opportunity | null>(null);

  const { opportunities, isLoading, updateStage } = useOpportunityPipelineViewModel({
    scope: agencyScope ? 'agency' : 'own',
    pageSize: 100,
  });

  useEffect(() => {
    if (!highlightOpportunityId || isLoading) return;
    const match = opportunities.find((o) => o.id === highlightOpportunityId);
    if (match) setOpenOpportunity(match);
    // Only ever needs to fire once, right after the data this depends on
    // (opportunities) first resolves — re-running on every opportunities
    // refetch would keep re-opening the modal after the user closes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightOpportunityId, isLoading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byStage = useMemo(() => {
    const map = new Map<OpportunityStage, Opportunity[]>();
    for (const o of opportunities) {
      const list = map.get(o.stage) ?? [];
      list.push(o);
      map.set(o.stage, list);
    }
    return map;
  }, [opportunities]);

  function commitStageChange(
    opportunity: Opportunity,
    toStage: OpportunityStage,
    lostReason?: string,
    callbacks?: { onSuccess?: () => void; onError?: () => void },
  ) {
    updateStage.mutate(
      { id: opportunity.id, input: { toStage, lostReason } },
      {
        onSuccess: () => {
          toast.success(`Moved to ${toStage.replace('_', ' ')}.`);
          callbacks?.onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Something went wrong — please try again.');
          callbacks?.onError?.();
        },
      },
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const opportunity = opportunities.find((o) => o.id === active.id);
    const toStage = over.id as OpportunityStage;
    if (!opportunity || opportunity.stage === toStage) return;

    if (!OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage].includes(toStage)) {
      toast.error(`Cannot move an opportunity from "${opportunity.stage}" to "${toStage}".`);
      return;
    }

    if (toStage === 'lost') {
      setPendingLostDrag(opportunity);
      return;
    }
    commitStageChange(opportunity, toStage);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Kanban className="h-5 w-5 text-primary" />
            Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag a card to move it through your pipeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pipeline/analytics"
            className="flex items-center gap-1.5 rounded-full border border-input px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </Link>
          {profile?.isAgencyAdmin && (
            <button
              type="button"
              onClick={() => setAgencyScope((v) => !v)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                agencyScope ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              {agencyScope ? 'Showing: Whole Agency' : 'Show Whole Agency'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-96 w-72 shrink-0 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGES.map((col) => (
              <KanbanColumn key={col.id} stage={col.id} label={col.label} opportunities={byStage.get(col.id) ?? []} onOpen={setOpenOpportunity} />
            ))}
          </div>
        </DndContext>
      )}

      <OpportunityDetailModal opportunity={openOpportunity} onClose={() => setOpenOpportunity(null)} />

      {/* Previously cleared pendingLostDrag synchronously right after
          firing the mutation — since Modal fully unmounts on open=false,
          that closed this modal (and its isPending-driven "Saving…" state)
          before the request had any chance to resolve, leaving no loading
          feedback at all during the round trip. Now only closes on a
          confirmed success; stays open (with the error toast already
          shown by commitStageChange) so the user can retry on failure. */}
      <LogLostReasonModal
        open={!!pendingLostDrag}
        onClose={() => setPendingLostDrag(null)}
        isPending={updateStage.isPending}
        onConfirm={(reason) => {
          if (!pendingLostDrag) return;
          commitStageChange(pendingLostDrag, 'lost', reason, { onSuccess: () => setPendingLostDrag(null) });
        }}
      />
    </div>
  );
}
