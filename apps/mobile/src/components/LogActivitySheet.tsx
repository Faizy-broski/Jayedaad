import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LoggableActivityType, useActivityTimelineViewModel } from '@jayedaad/core';
import { Button, Dialog, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';

const TYPE_OPTIONS: { value: LoggableActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
];

interface LogActivitySheetProps {
  open: boolean;
  onClose: () => void;
  leadId?: string;
  opportunityId?: string;
}

// RN mirror of apps/web/components/crm/LogActivityModal.tsx — same
// bottom-sheet form pattern as MarkDealSheet.tsx (Dialog + TextInput +
// Button, one mutation, toast on settle). Occurred-at defaults to "now"
// (no date/time picker dependency on mobile, same plain-text convention
// LeadDetailScreen's reminder composer already uses) rather than the web
// version's editable datetime-local field.
export function LogActivitySheet({ open, onClose, leadId, opportunityId }: LogActivitySheetProps) {
  const { logActivity } = useActivityTimelineViewModel({ leadId, opportunityId });
  const { showToast } = useToast();

  const [typeLabel, setTypeLabel] = useState('Call');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');

  useEffect(() => {
    if (!open) return;
    setTypeLabel('Call');
    setSummary('');
    setOutcome('');
  }, [open]);

  function submit() {
    if (!summary.trim()) {
      showToast('Enter a summary of what happened.', 'error');
      return;
    }
    const type = TYPE_OPTIONS.find((o) => o.label === typeLabel)?.value ?? 'call';
    logActivity.mutate(
      { type, occurredAt: new Date().toISOString(), summary: summary.trim(), outcome: outcome.trim() || undefined },
      {
        onSuccess: () => {
          showToast('Activity logged.');
          onClose();
        },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
      },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Log Activity">
      <View style={styles.form}>
        <PickerField
          value={typeLabel}
          options={TYPE_OPTIONS.map((o) => o.label)}
          onChange={setTypeLabel}
          title="Activity type"
          placeholder="Select type"
        />
        <TextInput label="Summary" value={summary} onChangeText={setSummary} placeholder="What happened…" multiline numberOfLines={3} autoFocus />
        <TextInput
          label="Outcome (optional)"
          value={outcome}
          onChangeText={setOutcome}
          placeholder="e.g. Interested, will follow up next week"
          multiline
          numberOfLines={2}
        />
        <Button label="Log Activity" onPress={submit} disabled={logActivity.isPending} style={styles.submit} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.spacing.md, paddingVertical: theme.spacing.xs },
  submit: { marginTop: theme.spacing.xs },
});
