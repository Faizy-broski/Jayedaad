'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DealType, Lead, useOpportunityPipelineViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal, Select } from '@jayedaad/ui-web';

function defaultExpectedCloseDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export interface ConvertToOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  // Fired on a successful conversion so the caller (crm/page.tsx) can
  // track which leads are already converted and hide/disable their
  // Convert action — the server never flips lead.status on conversion (the
  // two state machines are deliberately decoupled), so that's the only
  // client-side signal available short of a real backend field.
  onConverted?: (leadId: string) => void;
}

// "Convert to Opportunity" — promotes a contacted/negotiating lead into a
// real pre-close pipeline object (Phase 1's foundation, Phase 3 wires it
// into the UI). Eligibility (status, no existing active opportunity) is
// enforced server-side — this form doesn't pre-check "does this lead
// already have an opportunity" client-side (would need a new join on the
// lead list/detail endpoints purely for this one gate); a lead that
// already has one simply 400s with a clear message, surfaced as a toast.
export function ConvertToOpportunityModal({ open, onClose, lead, onConverted }: ConvertToOpportunityModalProps) {
  const router = useRouter();
  // enabled: false — this modal only ever needs the convertLead mutation,
  // not the opportunities list query the hook also runs; without this it
  // fired an unused GET /crm/opportunities on every /crm page load, since
  // the modal (gated only by its `open` prop) is always mounted there.
  const { convertLead } = useOpportunityPipelineViewModel({}, { enabled: false });

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState(defaultExpectedCloseDate());
  const [dealType, setDealType] = useState<DealType>('sale');

  useEffect(() => {
    if (!open || !lead) return;
    setName(`${lead.name} — opportunity`);
    setValue('');
    setExpectedCloseDate(defaultExpectedCloseDate());
    setDealType('sale');
  }, [open, lead]);

  function handleSubmit() {
    if (!lead) return;
    const parsedValue = Number(value);
    if (!name.trim()) {
      toast.error('Enter a name for this opportunity.');
      return;
    }
    if (!value || Number.isNaN(parsedValue) || parsedValue <= 0) {
      toast.error('Enter a valid value.');
      return;
    }
    convertLead.mutate(
      { leadId: lead.id, input: { name: name.trim(), value: parsedValue, expectedCloseDate, dealType } },
      {
        onSuccess: (opportunity) => {
          toast.success('Converted to opportunity.');
          onConverted?.(lead.id);
          onClose();
          // opportunityId identifies the new card so the board can open its
          // detail modal directly instead of dropping the user on a
          // qualification column with no indication which card is new.
          router.push(`/pipeline?opportunityId=${opportunity.id}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert to Opportunity"
      description="Moves this lead into your pipeline as a real, trackable deal-in-progress."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="opportunityName">Name</Label>
          <Input id="opportunityName" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="opportunityValue">Value (PKR)</Label>
            <Input
              id="opportunityValue"
              type="number"
              min={0}
              placeholder="e.g. 15000000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opportunityDealType">Deal Type</Label>
            <Select id="opportunityDealType" value={dealType} onChange={(e) => setDealType(e.target.value as DealType)}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opportunityExpectedCloseDate">Expected Close Date</Label>
          <Input
            id="opportunityExpectedCloseDate"
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={convertLead.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={convertLead.isPending}>
            {convertLead.isPending ? 'Converting…' : 'Convert'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
