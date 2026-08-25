import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Opportunity, OpportunityStage, OPPORTUNITY_STAGE_TRANSITIONS, useOpportunityDetailViewModel } from '@jayedaad/core';
import { Button, Dialog, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';

const STAGE_LABEL: Record<OpportunityStage, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

interface MoveStageSheetProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
}

// Mobile's explicit "advance the pipeline" action, since there's no
// drag-and-drop here (see PipelineScreen.tsx's own comment for why) — same
// Dialog-based bottom-sheet-form pattern as MarkDealSheet.tsx/
// LogActivitySheet.tsx. Only shows stages this opportunity can legally
// move to (OPPORTUNITY_STAGE_TRANSITIONS), same server-shared table the
// web Kanban board uses to gray out invalid drop targets.
export function MoveStageSheet({ open, onClose, opportunity }: MoveStageSheetProps) {
  const { updateStage } = useOpportunityDetailViewModel(opportunity.id);
  const { showToast } = useToast();

  const validTargets = OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage];
  const [targetLabel, setTargetLabel] = useState(validTargets[0] ? STAGE_LABEL[validTargets[0]] : '');
  const [lostReason, setLostReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setTargetLabel(validTargets[0] ? STAGE_LABEL[validTargets[0]] : '');
    setLostReason('');
  }, [open]);

  const targetStage = (Object.keys(STAGE_LABEL) as OpportunityStage[]).find((s) => STAGE_LABEL[s] === targetLabel);
  const isLostTarget = targetStage === 'lost';

  function submit() {
    if (!targetStage) return;
    if (isLostTarget && !lostReason.trim()) {
      showToast('Enter a reason for marking this opportunity lost.', 'error');
      return;
    }
    updateStage.mutate(
      { toStage: targetStage, lostReason: isLostTarget ? lostReason.trim() : undefined },
      {
        onSuccess: () => {
          showToast(`Moved to ${STAGE_LABEL[targetStage]}.`);
          onClose();
        },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
      },
    );
  }

  if (validTargets.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} title="Move Stage">
        <TextInput label="" value="This opportunity is already in a terminal stage." editable={false} multiline />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Move Stage">
      <View style={styles.form}>
        <PickerField
          value={targetLabel}
          options={validTargets.map((s) => STAGE_LABEL[s])}
          onChange={setTargetLabel}
          title="Move to"
          placeholder="Select stage"
        />
        {isLostTarget && (
          <TextInput
            label="Reason"
            value={lostReason}
            onChangeText={setLostReason}
            placeholder="e.g. Went with a competitor, budget fell through…"
            multiline
            numberOfLines={3}
          />
        )}
        <Button label="Move" onPress={submit} disabled={updateStage.isPending} style={styles.submit} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.md, paddingVertical: theme.spacing.xs },
  submit: { marginTop: theme.spacing.xs },
});
