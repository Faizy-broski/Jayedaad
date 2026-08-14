import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAgentProfileViewModel, useAuthViewModel, useFavoritesViewModel, useSavedSearchesViewModel } from '@jayedaad/core';
import { Card, CardContent, theme } from '@jayedaad/ui-native';
import { getRecentlyViewed } from '../lib/recentlyViewedStorage';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import settingsBannerImage from '../../assets/images/settings-banner.webp';

type CombinedParamList = RootStackParamList & BottomTabParamList;

type ListAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: keyof CombinedParamList;
  params?: CombinedParamList['Favorites'] | CombinedParamList['MyProperties'];
  agentOnly?: boolean;
  // Matches web's agent-settings layout.tsx NAV_ITEMS filter
  // (`!item.agencyAdminOnly || role === 'super_admin' || profile?.isAgencyAdmin`)
  // — a regular (non-admin) agent shouldn't see this even though they pass agentOnly.
  agencyAdminOnly?: boolean;
  // Opposite of agentOnly — "Become an Agent" only makes sense for a buyer
  // who isn't one yet (packages/core's useAgentApplicationViewModel, no
  // mobile entry point before this row).
  buyerOnly?: boolean;
};

const ACCOUNT_ITEMS: ListAction[] = [
  { label: 'Personal Information', icon: 'person-outline', route: 'ProfileSettings' },
  { label: 'Saved Searches', icon: 'search-outline', route: 'Favorites', params: { initialTab: 'saved' } },
  { label: 'My Favourites', icon: 'heart-outline', route: 'Favorites', params: { initialTab: 'favorites' } },
];

const SELLING_ITEMS: ListAction[] = [
  { label: 'My Properties', icon: 'home-outline', route: 'MyProperties' },
  { label: 'Drafts', icon: 'document-text-outline', route: 'MyProperties', params: { initialTab: 'drafts' } },
  { label: 'Realtor Dashboard', icon: 'stats-chart-outline', route: 'AgentDashboard', agentOnly: true },
  { label: 'My Projects', icon: 'business-outline', route: 'MyProjects', agentOnly: true },
  { label: 'Inbox', icon: 'mail-unread-outline', route: 'AgentCRM', agentOnly: true },
  { label: 'Agency Staff', icon: 'people-outline', route: 'AgencyStaff', agentOnly: true, agencyAdminOnly: true },
  { label: 'Agency Settings', icon: 'business-outline', route: 'AgencySettings', agentOnly: true, agencyAdminOnly: true },
  { label: 'Agency Analytics', icon: 'bar-chart-outline', route: 'AgencyAnalytics', agentOnly: true, agencyAdminOnly: true },
  { label: 'Plan', icon: 'card-outline', route: 'Plan', agentOnly: true },
  { label: 'Become an Agent', icon: 'briefcase-outline', route: 'ApplyAsAgent', buyerOnly: true },
];

const SUPPORT_ITEMS: ListAction[] = [
  // Ticket creation is server-gated to role 'agent' (services/api/src/
  // support), so Help Desk only makes sense for agents — everyone else
  // still has the generic Contact Us screen.
  { label: 'Help Desk', icon: 'help-buoy-outline', route: 'HelpDesk', agentOnly: true },
  { label: 'Contact Us', icon: 'chatbubble-ellipses-outline', route: 'Contact' },
  { label: 'Terms and Privacy Policy', icon: 'document-outline', route: 'Terms' },
];

// No premium/basic concept exists on user accounts anywhere in the data
// model — role is the only real distinguishing field.
const ROLE_LABELS: Record<string, string> = {
  agent: 'AGENT',
  owner: 'OWNER',
  buyer: 'BUYER',
  super_admin: 'ADMIN',
  verification_staff: 'STAFF',
};

const APP_VERSION = '0.1.0';
const DESTRUCTIVE_COLOR = theme.colors.danger;

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const { user, role, signOut, isAuthenticated } = useAuthViewModel();
  // Only agent accounts have a real profile photo today (agent_profiles.photo_url,
  // same field web's Profolio layout reads) — enabled: !!agentId internally,
  // so this is a no-op for buyer/owner accounts.
  const { profile: agentProfile } = useAgentProfileViewModel();
  const { favorites } = useFavoritesViewModel();
  const { savedSearches } = useSavedSearchesViewModel();
  const isAgent = role === 'agent' || role === 'super_admin';

  // No buyer-side view-history backend exists — tracked on-device instead,
  // same source HomeScreen's "Recent properties" section reads. Re-read on
  // every focus so the count stays current after viewing more listings.
  const [recentlyViewedCount, setRecentlyViewedCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getRecentlyViewed().then((data) => {
        if (active) setRecentlyViewedCount(data.length);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // BottomTabNavigator only gates *entering* this tab (tabPress) — nothing
  // watches auth dropping out while already here. Without this, tapping Log
  // Out below left this exact screen mounted with a stale/guest header but
  // every authenticated row (including Log Out itself) still visible, since
  // signOut.mutate() just clears the session and re-renders in place.
  useEffect(() => {
    if (!isAuthenticated) navigation.navigate('Home');
  }, [isAuthenticated, navigation]);

  const email = user?.email || '';
  const rawName = user?.user_metadata?.display_name as string | undefined;
  const displayName = rawName || (email ? email.split('@')[0] : 'Guest');
  // Web already distinguishes Agency vs Individual (agent-settings' "Agency"/
  // "Individual" pill, sourced off profile?.agency) — mobile's badge just
  // showed the raw role string for both, so an agency admin saw "AGENT"
  // same as a plain individual agent. agentProfile.agency is only ever
  // populated for a real agency member (registerSelfService/becomeAnAgent),
  // never for an individual agent.
  const roleLabel = role === 'agent' && agentProfile?.agency ? 'AGENCY' : role ? ROLE_LABELS[role] : undefined;

  function handleLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut.mutate() },
    ]);
  }

  function visibleItems(items: ListAction[]): ListAction[] {
    return items.filter(
      (action) =>
        (!action.agentOnly || isAgent) &&
        (!action.agencyAdminOnly || role === 'super_admin' || agentProfile?.isAgencyAdmin) &&
        (!action.buyerOnly || role === 'buyer'),
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Image source={settingsBannerImage} style={styles.headerBanner} resizeMode="cover" />
        <View style={styles.headerBody}>
          <View style={styles.avatar}>
            {agentProfile?.photoUrl ? (
              <Image source={{ uri: agentProfile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-outline" size={30} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          {!!email && <Text style={styles.email} numberOfLines={1}>{email}</Text>}
          {roleLabel && (
            <LinearGradient
              colors={theme.gradients.gold.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeTextWhite}>{roleLabel}</Text>
            </LinearGradient>
          )}
        </View>

        {/* STAT TILES — real counts, every role */}
        <View style={styles.statRow}>
          <Pressable
            style={styles.statTile}
            onPress={() => navigation.navigate('Favorites', { initialTab: 'favorites' })}
          >
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </Pressable>
          <Pressable
            style={[styles.statTile, styles.statTileActive]}
            onPress={() => navigation.navigate('Favorites', { initialTab: 'saved' })}
          >
            <Text style={styles.statValueLight}>{savedSearches.length}</Text>
            <Text style={styles.statLabelLight}>Searches</Text>
          </Pressable>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{recentlyViewedCount}</Text>
            <Text style={styles.statLabel}>Viewed</Text>
          </View>
        </View>

        <Section title="Account" items={visibleItems(ACCOUNT_ITEMS)} navigation={navigation} />
        <Section title="Selling" items={visibleItems(SELLING_ITEMS)} navigation={navigation} />
        <Section title="Support" items={visibleItems(SUPPORT_ITEMS)} navigation={navigation} />

        {/* PROMO CTA — shown right before Log Out */}
        <LinearGradient
          colors={[theme.colors.primary, theme.gradients.gold.colors[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoGradientCard}
        >
          <CardContent style={styles.promoContent}>
            <Ionicons name="business" size={36} color={theme.colors.bg} style={styles.promoIcon} />
            <Text style={styles.promoTextWhite}>Looking to sell or rent out your property?</Text>
            <Pressable
              style={({ pressed }) => [styles.promoButtonWhite, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('PostListing', undefined)}
            >
              <Text style={styles.promoButtonTextPrimary}>Post an Ad</Text>
            </Pressable>
          </CardContent>
        </LinearGradient>

        {/* ACCOUNT ACTIONS */}
        <Card style={[styles.listCard, styles.lastListCard]}>
          <CardContent style={styles.listContent}>
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={handleLogOut}>
              <Ionicons name="log-out-outline" size={22} color={DESTRUCTIVE_COLOR} />
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowLabel, styles.logOutLabel]}>Log Out</Text>
              </View>
            </Pressable>
            <View style={[styles.row, styles.rowLast]}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.muted} />
              <View style={styles.rowTextWrap}>
                <Text style={styles.versionLabel}>App Version</Text>
                <Text style={styles.versionValue}>{APP_VERSION}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Helper Components ---

function Section({
  title,
  items,
  navigation,
}: {
  title: string;
  items: ListAction[];
  navigation: NativeStackNavigationProp<CombinedParamList>;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.listCard}>
        <CardContent style={styles.listContent}>
          {items.map((action, i) => (
            <ListRow
              key={action.label}
              icon={action.icon}
              label={action.label}
              onPress={() => navigation.navigate(action.route as any, action.params as any)}
              isLast={i === items.length - 1}
            />
          ))}
        </CardContent>
      </Card>
    </View>
  );
}

function ListRow({
  icon,
  label,
  value,
  onPress,
  disabled,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, isLast && styles.rowLast, pressed && !disabled && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <Ionicons name={icon} size={22} color={theme.colors.muted} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedLight} />
    </Pressable>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  headerBanner: {
    height: 96,
    marginHorizontal: -20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBody: { alignItems: 'center', marginTop: -44 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.bg,
    borderWidth: 3,
    borderColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatarImage: { width: 88, height: 88 },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
    marginTop: theme.spacing.sm,
  },
  email: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  badgeGradient: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    shadowColor: theme.gradients.gold.colors[1],
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeTextWhite: { fontSize: 10, fontWeight: '800', color: theme.colors.bg, letterSpacing: 1 },

  statRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  statTileActive: { backgroundColor: theme.colors.primary },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  statValueLight: { fontSize: 20, fontWeight: '800', color: theme.colors.bg },
  statLabelLight: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  promoGradientCard: {
    borderRadius: 16,
    marginTop: theme.spacing.lg,
    shadowColor: '#09573D',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  promoContent: { alignItems: 'center', padding: 20 },
  promoIcon: { marginBottom: 12 },
  promoTextWhite: { fontSize: 16, fontWeight: '800', color: theme.colors.bg, textAlign: 'center', marginBottom: 16 },
  promoButtonWhite: {
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  promoButtonTextPrimary: { color: theme.colors.primary, fontWeight: '800', fontSize: 15 },

  section: { marginTop: theme.spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },

  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  lastListCard: { marginTop: theme.spacing.xl },
  listContent: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    backgroundColor: theme.colors.bg,
  },
  rowPressed: { backgroundColor: theme.colors.surface },
  rowLast: { borderBottomWidth: 0 },
  rowTextWrap: { flex: 1, marginLeft: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  rowValue: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', marginTop: 2 },

  logOutLabel: { color: DESTRUCTIVE_COLOR },
  versionLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  versionValue: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
});
