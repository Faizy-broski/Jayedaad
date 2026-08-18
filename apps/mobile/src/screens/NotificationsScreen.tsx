import { FlatList, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Notification, NotificationType, useNotificationsViewModel } from '@jayedaad/core';
import { BackButton, theme } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// One icon per real NotificationType (see services/api's
// NotificationsRepository) — no icon exists for the Figma mockup's own
// invented copy ("Visit confirmed", "Picked for you", etc.), since this app
// doesn't have those notification kinds; this maps the types that actually
// exist instead.
const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  price_drop: 'trending-down',
  new_match: 'home',
  inquiry_reply: 'chatbubble-ellipses',
  verification_status: 'shield-checkmark',
  lead_assigned: 'briefcase',
  reminder: 'calendar',
  support_ticket: 'help-circle',
};

// Per-type icon badge accent — lead_assigned ("new lead") gets its own
// darker green; every other type keeps the app's usual primary green.
const TYPE_ACCENT: Partial<Record<NotificationType, string>> = {
  lead_assigned: '#034B37',
};

// Full persistent history, unread/read distinguished by card tint (icon
// badge solid-green-on-unread vs pale-outline-on-read) — reference design
// explicitly shows both states in one list together. Previously this
// screen filtered down to unread-only (a notification vanished the moment
// it was read), which matched a different, earlier request for the
// "Mark all read" action specifically; this redesign supersedes that for
// this screen — "Mark all read" now clears every card's tint instead of
// emptying the list.
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
    const unread = !item.readAt;
    const accent = TYPE_ACCENT[item.type] ?? theme.colors.primary;
    return (
      <Pressable style={styles.card} onPress={() => handlePress(item)}>
        <View style={[styles.iconBadge, unread ? { backgroundColor: accent } : styles.iconBadgeRead]}>
          <Ionicons
            name={TYPE_ICON[item.type] ?? 'notifications-outline'}
            size={18}
            color={unread ? '#ffffff' : accent}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
          </View>
          {item.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Notification</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={() => markAllRead.mutate()}>
            <Ionicons name="checkmark-done" size={14} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

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
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  backButton: { width: 32, height: 32, justifyContent: 'center', marginBottom: theme.spacing.sm },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  headerSubtitle: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  markAllBtn: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.xl },
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.xl },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
  emptyText: { fontSize: 13, color: theme.colors.muted },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
  // Every card shares this one background now — unread/read is signaled by
  // the icon badge (solid accent fill vs pale) instead of a card-level tint.
  card: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: '#F3F4F6',
  },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconBadgeRead: { backgroundColor: theme.colors.secondaryBg },
  cardBody: { flex: 1, gap: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  time: { fontSize: 11, color: theme.colors.mutedLight },
  body: { fontSize: 12, color: theme.colors.muted, lineHeight: 16 },
});
