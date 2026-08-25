import { useState } from 'react';
import { ScrollView, SafeAreaView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { OpportunityStage, useFormattedPrice, useOpportunityDetailViewModel } from '@jayedaad/core';
import { Button, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { LogActivitySheet } from '../components/LogActivitySheet';
import { MoveStageSheet } from '../components/MoveStageSheet';

const STAGE_LABEL: Record<OpportunityStage, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// RN mirror of LeadDetailScreen.tsx's structure — value/stage/expected
// close date header, ActivityTimeline + Log Activity (Phase 2, reused
// unmodified), and this screen's own real action: "Move Stage" (the
// mobile equivalent of dragging a card on the web Kanban board, see
// PipelineScreen.tsx's comment on why mobile doesn't get drag-and-drop).
export function OpportunityDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OpportunityDetail'>>();
  const { opportunityId } = route.params;
  const { format: formatPrice } = useFormattedPrice();
  const { opportunity, isLoading, isError, refetch } = useOpportunityDetailViewModel(opportunityId);
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [moveStageOpen, setMoveStageOpen] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (isError || !opportunity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.muted} />
          <Text style={styles.errorText}>Couldn&apos;t load this opportunity.</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const isTerminal = opportunity.stage === 'won' || opportunity.stage === 'lost';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{opportunity.name}</Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageBadgeText}>{STAGE_LABEL[opportunity.stage]}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Value</Text>
            <Text style={styles.statValue}>{formatPrice(opportunity.value)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Probability</Text>
            <Text style={styles.statValue}>{opportunity.probability}%</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Expected Close</Text>
            <Text style={styles.statValue}>{formatDate(opportunity.expectedCloseDate)}</Text>
          </View>
        </View>

        {opportunity.lostReason ? (
          <View style={styles.lostReasonBox}>
            <Text style={styles.lostReasonLabel}>Lost reason</Text>
            <Text style={styles.lostReasonText}>{opportunity.lostReason}</Text>
          </View>
        ) : null}

        {!isTerminal && (
          <Button label="Move Stage" onPress={() => setMoveStageOpen(true)} style={styles.moveStageButton} />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Activity</Text>
            <Pressable style={styles.logActivityBtn} onPress={() => setLogActivityOpen(true)} hitSlop={6}>
              <Ionicons name="add-circle-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.logActivityBtnText}>Log Activity</Text>
            </Pressable>
          </View>
          <ActivityTimeline opportunityId={opportunity.id} />
        </View>
      </ScrollView>

      <LogActivitySheet open={logActivityOpen} onClose={() => setLogActivityOpen(false)} opportunityId={opportunity.id} />
      <MoveStageSheet open={moveStageOpen} onClose={() => setMoveStageOpen(false)} opportunity={opportunity} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.xl },
  errorState: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: theme.spacing.sm },
  errorText: { color: theme.colors.muted },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  stageBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  stageBadgeText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, color: theme.colors.muted },
  statValue: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: 2 },
  lostReasonBox: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
  },
  lostReasonLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.danger },
  lostReasonText: { fontSize: 13, color: theme.colors.danger, marginTop: 2 },
  moveStageButton: { marginTop: theme.spacing.lg },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  logActivityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logActivityBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
});
