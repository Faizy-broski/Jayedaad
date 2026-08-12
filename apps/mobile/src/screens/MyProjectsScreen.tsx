import { useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Project, ProjectStatus, canDeleteProject, canEditProject, useAuthViewModel, useManageProjectsViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const STATUS_TABS: { id: 'all' | ProjectStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'planned', label: 'Planned' },
  { id: 'under_construction', label: 'Under Construction' },
  { id: 'ready', label: 'Ready' },
];

const VERIFICATION_COLORS: Record<Project['verificationStatus'], { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  verified: { bg: '#DCFCE7', text: '#166534' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
  draft: { bg: theme.colors.surfaceAlt, text: theme.colors.muted },
};

// Mirrors apps/web/components/projects/ProjectsListView.tsx — agent/Super
// Admin "manage" list (every verification_status, unlike the public
// ProjectsScreen tab which only shows 'verified'). Reuses the exact same
// canEditProject/canDeleteProject rules from packages/core so mobile and
// web enforce identically, and the same card/action-row visual pattern
// MyPropertiesScreen.tsx already established for listings.
export function MyProjectsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { role, user } = useAuthViewModel();
  const isSuperAdmin = role === 'super_admin';
  const { projects, isLoading, error, setVerificationStatus, remove } = useManageProjectsViewModel();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus>('all');

  const visibleProjects = activeTab === 'all' ? projects : projects.filter((p) => p.status === activeTab);

  function handleVerify(id: string, status: 'verified' | 'rejected') {
    setVerificationStatus.mutate(
      { id, input: { status } },
      {
        onSuccess: () => showToast(status === 'verified' ? 'Project approved.' : 'Project rejected.'),
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Project', `Are you sure you want to delete "${name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => showToast('Project deleted.'),
            onError: () => showToast('Something went wrong — please try again.', 'error'),
          }),
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Projects</Text>
        <Button label="Post Project" size="md" onPress={() => navigation.navigate('PostProject')} />
      </View>

      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.pill, tab.id === activeTab && styles.pillActive]}
            >
              <Text style={[styles.pillText, tab.id === activeTab && styles.pillTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Fetching projects…</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.error}>Couldn't load projects — please try again.</Text>
        </View>
      ) : visibleProjects.length === 0 ? (
        <EmptyState onAddProject={() => navigation.navigate('PostProject')} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {visibleProjects.map((project) => {
            const editable = canEditProject(project, role, user?.id);
            const deletable = canDeleteProject(project, role, user?.id);
            const verificationColor = VERIFICATION_COLORS[project.verificationStatus];
            return (
              <View key={project.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: verificationColor.bg }]}>
                    <Text style={[styles.badgeText, { color: verificationColor.text }]}>{project.verificationStatus}</Text>
                  </View>
                  <Text style={styles.unitTypesText}>{project.unitTypeCount} unit type(s)</Text>
                </View>

                <Text style={styles.rowTitle} numberOfLines={1}>{project.name}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {project.developer.name} · {project.area}, {project.city}
                </Text>
                <Text style={styles.statusText}>{project.status.replace('_', ' ')}</Text>

                <View style={styles.cardDivider} />

                {isSuperAdmin && project.verificationStatus === 'pending' && (
                  <View style={styles.verifyRow}>
                    <Pressable
                      style={styles.actionButton}
                      disabled={setVerificationStatus.isPending}
                      onPress={() => handleVerify(project.id, 'verified')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionTextPrimary}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      disabled={setVerificationStatus.isPending}
                      onPress={() => handleVerify(project.id, 'rejected')}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={theme.colors.danger} />
                      <Text style={styles.actionTextDestructive}>Reject</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('PostProject', { editProjectId: project.id, viewOnly: !editable })}
                  >
                    <Ionicons name={editable ? 'create-outline' : 'eye-outline'} size={16} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary}>{editable ? 'Edit' : 'View'}</Text>
                  </Pressable>
                  {deletable && (
                    <Pressable style={styles.actionButton} disabled={remove.isPending} onPress={() => handleDelete(project.id, project.name)}>
                      <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                      <Text style={styles.actionTextDestructive}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({ onAddProject }: { onAddProject: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="business-outline" size={38} color={theme.colors.mutedLight} />
      </View>
      <Text style={styles.emptyHeading}>No Projects Yet</Text>
      <Text style={styles.emptyMessage}>You haven&apos;t posted any developments yet. Post one to get started.</Text>
      <View style={styles.emptyButtonWrapper}>
        <Button label="Post Project" onPress={onAddProject} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  pillContainer: { borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceAlt },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 16 },
  pill: { backgroundColor: theme.colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  pillActive: { backgroundColor: theme.colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  pillTextActive: { color: theme.colors.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: theme.colors.mutedLight, fontWeight: '500' },
  error: { fontSize: 14, color: theme.colors.danger, fontWeight: '500' },
  list: { paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
  card: {
    backgroundColor: theme.colors.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  unitTypesText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  rowTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  rowSubtitle: { fontSize: 13, color: theme.colors.muted, fontWeight: '500' },
  statusText: { fontSize: 12, color: theme.colors.mutedLight, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  cardDivider: { height: 1, backgroundColor: theme.colors.surfaceAlt, marginVertical: 16 },
  verifyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6 },
  actionTextPrimary: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  actionTextDestructive: { fontSize: 13, fontWeight: '600', color: theme.colors.danger },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
  },
  emptyHeading: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: theme.colors.muted, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  emptyButtonWrapper: { width: '100%' },
});
