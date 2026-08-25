import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActivityTimelineViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  call: 'call-outline',
  email: 'mail-outline',
  whatsapp: 'logo-whatsapp',
  meeting: 'people-outline',
};

const TYPE_LABEL: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  whatsapp: 'WhatsApp',
  meeting: 'Meeting',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// RN mirror of apps/web/components/crm/ActivityTimeline.tsx — real
// interaction history (calls/emails/whatsapp/meetings) logged against a
// lead or an opportunity. First time either mobile detail screen gets any
// rendered activity timeline.
export function ActivityTimeline({ leadId, opportunityId }: { leadId?: string; opportunityId?: string }) {
  const { activity, isLoading, isError } = useActivityTimelineViewModel({ leadId, opportunityId });

  if (isLoading) return <Text style={styles.muted}>Loading…</Text>;
  // Previously unread — a failed fetch resolved `activity` to [] and this
  // fell straight into the empty-state branch below, reading as "no
  // activity" when the real story was "couldn't load it."
  if (isError) return <Text style={styles.errorText}>Couldn&apos;t load activity — please try again.</Text>;
  if (activity.length === 0) return <Text style={styles.muted}>No activity logged yet.</Text>;

  return (
    <View style={styles.list}>
      {activity.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={TYPE_ICON[entry.type] ?? 'ellipse-outline'} size={14} color={theme.colors.primary} />
          </View>
          <View style={styles.body}>
            <View style={styles.headerRow}>
              <Text style={styles.type}>{TYPE_LABEL[entry.type] ?? entry.type}</Text>
              <Text style={styles.date}>{formatDate(entry.occurredAt)}</Text>
            </View>
            <Text style={styles.summary}>{entry.summary}</Text>
            {entry.outcome ? <Text style={styles.outcome}>Outcome: {entry.outcome}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: theme.colors.muted, fontSize: 13 },
  errorText: { color: theme.colors.danger, fontSize: 13 },
  list: { gap: theme.spacing.sm },
  card: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  date: { fontSize: 10, color: theme.colors.muted },
  summary: { fontSize: 12, color: theme.colors.text },
  outcome: { fontSize: 11, fontStyle: 'italic', color: theme.colors.muted },
});
