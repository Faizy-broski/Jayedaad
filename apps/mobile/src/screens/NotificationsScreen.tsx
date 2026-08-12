import { FlatList, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Notification, useNotificationsViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Mobile counterpart to apps/web's NotificationBell dropdown — same
// GET /notifications + mark-read/mark-all-read endpoints, just a full
// screen instead of a panel (no hover/dropdown affordance on touch).
// Reached from HomeScreen's bell icon. Tap-to-navigate mirrors (and for
// lead_assigned, exceeds) web's NotificationBell.tsx routing — previously
// a tap only marked read and went nowhere, which is most of why mobile
// notifications felt broken/dead.
export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notifications, unreadCount, isLoading, isError, markRead, markAllRead } = useNotificationsViewModel();

  function handlePress(item: Notification) {
    if (!item.readAt) markRead.mutate(item.id);
    if (item.type === 'support_ticket') {
      navigation.navigate('HelpDesk');
    } else if (item.type === 'new_match' && item.relatedListingId) {
      navigation.navigate('ListingDetail', { listingId: item.relatedListingId });
    } else if (item.type === 'lead_assigned' && item.relatedLeadId) {
      navigation.navigate('LeadDetail', { leadId: item.relatedLeadId });
    } else if (item.type === 'verification_status') {
      navigation.navigate('BecomeAnAgent');
    }
  }

  function renderItem({ item }: { item: Notification }) {
    return (
      <Pressable style={[styles.row, !item.readAt && styles.rowUnread]} onPress={() => handlePress(item)}>
        {!item.readAt && <View style={styles.dot} />}
        <View style={styles.rowContent}>
          <Text style={styles.title}>{item.title}</Text>
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Pressable style={styles.markAllBtn} onPress={() => markAllRead.mutate()}>
            <Ionicons name="checkmark-done" size={14} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : isError ? (
        <Text style={styles.error}>Couldn't load notifications — please try again.</Text>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={32} color={theme.colors.mutedLight} />
          <Text style={styles.emptyText}>Nothing yet.</Text>
        </View>
      ) : (
        <FlatList data={notifications} keyExtractor={(n) => n.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: theme.spacing.xs },
  markAllText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.xl },
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xl },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
  emptyText: { fontSize: 13, color: theme.colors.muted },
  list: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm, borderRadius: 12, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceAlt },
  rowUnread: { backgroundColor: theme.colors.secondaryBg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginTop: 6 },
  rowContent: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: 12, color: theme.colors.muted },
  time: { fontSize: 10, color: theme.colors.mutedLight, marginTop: 2 },
});
