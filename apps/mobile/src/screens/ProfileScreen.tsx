import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAgentProfileViewModel, useAuthViewModel, useFavoritesViewModel, useSavedSearchesViewModel } from '@jayedaad/core';
import { CardContent, theme } from '@jayedaad/ui-native';
import { getRecentlyViewed } from '../lib/recentlyViewedStorage';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import settingsBannerImage from '../../assets/images/settings-banner.webp';
import promoBgImage from '../../assets/images/explore-bg.png';

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
  { label: 'Pipeline', icon: 'grid-outline', route: 'Pipeline', agentOnly: true },
  { label: 'Revenue', icon: 'wallet-outline', route: 'Revenue', agentOnly: true },
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
  // display_name is only ever set by our own email/password signUp() —
  // Google/Apple sign-in populate full_name/name instead, so this fell
  // through to the email's local-part for every OAuth-signed-in user.
  const rawName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined);
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
        {/* HEADER — expo-image (not plain RN Image) so contentPosition can
            bias the crop toward the house instead of RN's fixed
            dead-center crop, which left the source photo's palm-tree
            padding on the left eating into the house and made it read as
            off-center once stretched full-bleed. */}
        <ExpoImage
          source={settingsBannerImage}
          style={styles.headerBanner}
          contentFit="cover"
          contentPosition={{ right: 0 }}
        />
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

        {/* PROMO CTA — shown right before Log Out. Same treatment as
            HomeScreen's PremiumPromoCard: explore-bg.png is a
            TRANSPARENT-background villa cutout, not a rectangular photo —
            stretched full-bleed with resizeMode="cover" (an earlier version
            of this card) just showed its transparent regions as flat solid
            color, which is why the photo never appeared no matter the
            overlay opacity. Opaque gradient base fills the card, cutout
            sits in the bottom-right corner at its own aspect ratio
            (resizeMode="contain", positioned+sized, not stretched) — same
            full-strength prominence as the Home card now (a prior version
            here faded it to 0.55 opacity "to stay out of the text's way,"
            which just made it barely visible again). Clipping lives on a
            separate bgLayer behind the text, not on the outer card, so a
            longer translation/localized copy someday can't silently clip
            the button the way a fixed-height + overflow:hidden card would. */}
        <View style={styles.promoGradientCard}>
          <View style={styles.promoBgLayer}>
            <LinearGradient colors={['#034B37', '#011B14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Image source={promoBgImage} style={styles.promoCutoutImage} resizeMode="contain" />
          </View>

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
        </View>

        {/* ACCOUNT ACTIONS — same flat, borderless row treatment as Section
            below, not a boxed card. */}
        <View style={styles.lastSection}>
          <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={handleLogOut}>
            <View style={[styles.iconCircle, styles.iconCircleDanger]}>
              <Ionicons name="log-out-outline" size={18} color={DESTRUCTIVE_COLOR} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowLabel, styles.logOutLabel]}>Log Out</Text>
            </View>
          </Pressable>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.muted} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.versionLabel}>App Version</Text>
            </View>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
        </View>
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
      <View>
        {items.map((action) => (
          <ListRow
            key={action.label}
            icon={action.icon}
            label={action.label}
            onPress={() => navigation.navigate(action.route as any, action.params as any)}
          />
        ))}
      </View>
    </View>
  );
}

// Figma reference: no bordered/shadowed card wrapping the rows, no divider
// lines between them — just flat rows with a soft #F3F4F6 icon circle
// (theme.colors.surfaceAlt, already that exact hex) carrying all the visual
// weight instead.
function ListRow({
  icon,
  label,
  value,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={theme.colors.text} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedLight} />
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
  promoBgLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#011B14',
  },
  promoContent: { alignItems: 'center', padding: 20 },
  promoIcon: { marginBottom: 12 },
  // Sized up — at 190x165 the villa read as a faint corner accent on this
  // card's larger footprint (full content width, icon+2-line-title+button
  // stacked tall) compared to how prominent it looks on the narrower Home
  // screen card. Bigger box, same "contain" fit, so it actually reads as
  // the dominant background element instead of a barely-there sliver.
  promoCutoutImage: {
    position: 'absolute',
    right: -20,
    bottom: -16,
    width: 280,
    height: 244,
  },
  // Text shadow (not a heavier photo tint) is what keeps this readable now
  // that the wash is light enough for the photo to actually show through.
  promoTextWhite: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.bg,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
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
  lastSection: { marginTop: theme.spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },

  // Flat rows, no card border/shadow, no divider lines — just a rounded
  // #F3F4F6 icon circle per row for visual structure (matches the Figma
  // reference, which has no lined/boxed sections at all).
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: theme.spacing.md,
  },
  rowPressed: { opacity: 0.6 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: { backgroundColor: theme.colors.dangerBg },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  rowValue: { fontSize: 13, color: theme.colors.muted, fontWeight: '600', marginRight: 4 },

  logOutLabel: { color: DESTRUCTIVE_COLOR },
  versionLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  versionValue: { fontSize: 13, color: theme.colors.muted, marginRight: 4 },
});
