'use client';

import { useEffect, useState } from 'react';
import { ListingPurpose, useMarkDealViewModel, useMyAgencyViewModel } from '@jayedaad/core';
import { Button, Input, Label, Modal, Textarea } from '@jayedaad/ui-web';
import toast from 'react-hot-toast';

// Shared "Mark Sold"/"Mark Rented" form — same modal used from both
// property-management/page.tsx's row action and the per-listing Performance
// page's header action, so the two call sites can't drift on field
// shape/validation. Purpose picks the form's flavor (sale price vs. monthly
// rent) — a listing is only ever eligible for one action based on its own
// `purpose`, so the caller decides which to render, this just renders it.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface MarkDealModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  purpose: ListingPurpose;
  onSuccess?: () => void;
}

export function MarkDealModal({ open, onClose, listingId, purpose, onSuccess }: MarkDealModalProps) {
  const { markSold, markRented } = useMarkDealViewModel();
  // Prefills the commission rate from the agency's own default, when the
  // signed-in agent belongs to one — a no-op query for an independent agent
  // (useMyAgencyViewModel is disabled without an agency slug).
  const { agency } = useMyAgencyViewModel();

  const [amount, setAmount] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [closedAt, setClosedAt] = useState(todayIso());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setCommissionRate(agency?.defaultCommissionRate != null ? String(agency.defaultCommissionRate) : '');
    setClosedAt(todayIso());
    setNotes('');
  }, [open, agency?.defaultCommissionRate]);

  const isSale = purpose === 'sale';
  const mutation = isSale ? markSold : markRented;

  function handleSubmit() {
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(isSale ? 'Enter a valid sale price.' : 'Enter a valid monthly rent amount.');
      return;
    }

    const base = {
      commissionRate: commissionRate ? Number(commissionRate) : undefined,
      closedAt: closedAt || undefined,
      notes: notes || undefined,
    };

    const onSettled = {
      onSuccess: () => {
        toast.success(isSale ? 'Listing marked as sold.' : 'Listing marked as rented.');
        onClose();
        onSuccess?.();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Something went wrong — please try again.'),
    };

    if (isSale) {
      markSold.mutate({ listingId, input: { ...base, salePrice: parsedAmount } }, onSettled);
    } else {
      markRented.mutate({ listingId, input: { ...base, monthlyRent: parsedAmount } }, onSettled);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSale ? 'Mark as Sold' : 'Mark as Rented'}
      description={isSale ? 'Record the closed sale to add it to your revenue.' : 'Record the closed rental to add it to your revenue.'}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dealAmount">{isSale ? 'Sale Price (PKR)' : 'Monthly Rent Amount (PKR)'}</Label>
          <Input
            id="dealAmount"
            type="number"
            min={0}
            placeholder={isSale ? 'e.g. 15000000' : 'e.g. 85000'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dealCommissionRate">Commission Rate %</Label>
          <Input
            id="dealCommissionRate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="Platform default"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dealClosedAt">Closing Date</Label>
          <Input id="dealClosedAt" type="date" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dealNotes">Notes (optional)</Label>
          <Textarea id="dealNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details about this deal…" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isSale ? 'Mark Sold' : 'Mark Rented'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
