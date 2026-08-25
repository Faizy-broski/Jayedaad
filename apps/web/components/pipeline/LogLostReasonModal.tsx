'use client';

import { useEffect, useState } from 'react';
import { Button, Label, Modal, Textarea } from '@jayedaad/ui-web';

export interface LogLostReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

// Opens when a card is dropped into the "Lost" column — the server
// requires a lostReason on that transition (opportunities.repository.ts's
// updateStage), so this collects it before committing the move rather than
// letting the drop round-trip into a 400.
export function LogLostReasonModal({ open, onClose, onConfirm, isPending }: LogLostReasonModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Mark as Lost" description="A reason is required before this opportunity moves to Lost.">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lostReason">Reason</Label>
          <Textarea id="lostReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Went with a competitor, budget fell through…" autoFocus />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim() || isPending}>
            {isPending ? 'Saving…' : 'Mark Lost'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
