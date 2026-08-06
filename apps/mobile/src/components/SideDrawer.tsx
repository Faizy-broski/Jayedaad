import { useEffect, useRef } from 'react';
import { Alert, Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import logoImage from '../../assets/images/jayedaad.webp';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { useAuthGate } from '../auth/AuthGateContext';

type Nav = NativeStackNavigationProp<RootStackParamList & BottomTabParamList>;

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);

// No destructive/error token exists in ui-native's theme yet — matches the
// convention already established in ProfileScreen.tsx.
const DESTRUCTIVE_COLOR = '#dc2626';

// App version has no expo-constants dependency wired up — same hardcoded
// placeholder convention as ProfileScreen.tsx.
const APP_VERSION = '0.1.0';

export interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// Hand-rolled slide-out drawer (Modal + Animated), not @react-navigation/drawer
// — avoids adding that package's native peers (react-native-gesture-handler,
// react-native-reanimated), the kind of new native dependency that already
// caused real version-mismatch breakage earlier this session.
export function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const navigation = useNavigation<Nav>();
  const { user, role, signOut } = useAuthViewModel();
  const isAgent = role === 'agent' || role === 'super_admin';
  // enabled: !!agentId inside the hook itself — a no-op fetch for non-agents.
  const { profile: agentProfile } = useAgentProfileViewModel();
  const canManageAgency = role === 'super_admin' || !!agentProfile?.isAgencyAdmin;
  // Persistent re-entry point for BecomeAnAgentScreen's required onboarding
  // documents (Owner ID + Company Registration) — that screen otherwise
  // only ever appears once, right after fresh signup, so a user who
  // force-quit before finishing it would have no way back in. Shown for
  // any not-yet-verified agency admin, mirrors AuthGateProvider's own
  // needsAgencyDocuments condition.
  const { reopenAgentGate } = useAuthGate();
  const needsAgencyDocuments = !!agentProfile?.agency && agentProfile.agency.verificationStatus !== 'verified';
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  const displayName = (user?.user_metadata?.display_name as string | undefined) || user?.email || 'Guest';

  function go(route: keyof (RootStackParamList & BottomTabParamList), params?: any) {
    onClose();
    navigation.navigate(route as any, params);
  }

  function handleLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut.mutate();
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <Image source={logoImage} style={styles.logo} contentFit="contain" />
            <Text style={styles.name}>{displayName}</Text>
            <Pressable onPress={() => go('Profile')}>
              <Text style={styles.viewProfile}>View Profile →</Text>
            </Pressable>

            <View style={styles.divider} />

            <NavRow icon="home" label="Home" active onPress={() => go('Home')} />
            <NavRow icon="add-circle-outline" label="Add Property" onPress={() => go('PostListing')} />
            <NavRow icon="search-outline" label="Search Properties" onPress={() => go('BuyerSearch')} />
            <NavRow icon="heart-outline" label="Favorites" onPress={() => go('Favorites', { initialTab: 'favorites' })} />
            <NavRow icon="bookmark-outline" label="Saved Searches" onPress={() => go('Favorites', { initialTab: 'saved' })} />

            <SectionLabel>Properties and Quota</SectionLabel>
            <NavRow icon="home-outline" label="My Properties" onPress={() => go('MyProperties')} />
            <NavRow icon="document-text-outline" label="Drafts" onPress={() => go('MyProperties', { initialTab: 'drafts' })} />
            {isAgent && <NavRow icon="business-outline" label="My Projects" onPress={() => go('MyProjects')} />}
            {/* Owners get a calendar too — Book a Visit on an owner-posted
                listing (no assigned agent) lands there directly. */}
            {(isAgent || role === 'owner') && (
              <NavRow icon="calendar-outline" label="Calendar" onPress={() => go('Calendar')} />
            )}
            {canManageAgency && <NavRow icon="people-outline" label="Agency Staff" onPress={() => go('AgencyStaff')} />}
            {needsAgencyDocuments && (
              <NavRow
                icon="alert-circle-outline"
                label="Complete Agency Verification"
                onPress={() => {
                  onClose();
                  reopenAgentGate();
                }}
              />
            )}

            <SectionLabel>App Controls</SectionLabel>
            <NavRow icon="settings-outline" label="Settings" onPress={() => go('ProfileSettings')} />
            <NavRow icon="information-circle-outline" label="About Us" onPress={() => go('AboutUs')} />
            <NavRow icon="call-outline" label="Contact Us" onPress={() => go('Contact')} />
            <NavRow icon="document-outline" label="Terms & Privacy Policy" onPress={() => go('Terms')} />
            <Pressable style={styles.row} onPress={handleLogOut}>
              <Ionicons name="log-out-outline" size={20} color={DESTRUCTIVE_COLOR} />
              <Text style={[styles.rowLabel, { color: DESTRUCTIVE_COLOR }]}>Log Out</Text>
            </Pressable>

            <Text style={styles.version}>App Version {APP_VERSION}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <>
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>{children}</Text>
    </>
  );
}

function NavRow({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[styles.row, active && styles.rowActive]}
    >
      <Ionicons name={icon} size={20} color={active ? theme.colors.primary : disabled ? theme.colors.border : theme.colors.muted} />
      <Text style={[styles.rowLabel, active && styles.rowLabelActive, disabled && styles.rowLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.4)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: theme.colors.bg,
  },
  content: { padding: theme.spacing.lg, paddingTop: theme.spacing.xxl, gap: 2 },
  logo: { width: 96, height: 96, alignSelf: 'flex-start', marginBottom: theme.spacing.sm },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  viewProfile: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginTop: 2, marginBottom: theme.spacing.sm },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
  },
  rowActive: { backgroundColor: theme.colors.secondaryBg },
  rowLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  rowLabelActive: { color: theme.colors.primary },
  rowLabelDisabled: { color: theme.colors.border },
  version: { marginTop: theme.spacing.lg, fontSize: 11, color: theme.colors.muted, textAlign: 'center' },
});
