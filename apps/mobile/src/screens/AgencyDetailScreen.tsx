import { useState } from 'react';
import { Image, Linking, ScrollView, Text, TextInput as RNTextInput, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAgencyDetailViewModel, useContactViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';

const TIER_LABEL: Record<string, string> = { titanium: 'Titanium', featured: 'Featured' };

// Mobile counterpart to apps/web's AgencyDetail.tsx (apps/web /agents/[slug])
// — header/stats/staff/about/contact, same useAgencyDetailViewModel
// (packages/core) web already uses, just no mobile screen consumed it
// before this.
export function AgencyDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AgencyDetail'>>();
  const { agency, isLoading, stats } = useAgencyDetailViewModel(route.params.agencySlug);
  const { submit } = useContactViewModel();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function goListings(purpose: 'sale' | 'rent', propertyTypeSlug?: string) {
    if (!agency) return;
    navigation.navigate('BuyerSearch', {
      initialFilters: { purpose, agencySlug: agency.slug, propertyTypeSlug: propertyTypeSlug ?? '' },
    });
  }

  function handleSend() {
    if (!agency || !name.trim() || !phone.trim() || !message.trim()) {
      showToast('Please fill in your name, phone, and message.', 'error');
      return;
    }
    submit.mutate(
      { name, phone, email, subject: `Inquiry for ${agency.name}`, message, agencyId: agency.id },
      {
        onSuccess: () => {
          showToast('Message sent — the agency will get back to you soon.');
          setName('');
          setPhone('');
          setEmail('');
          setMessage('');
        },
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  if (isLoading || !agency) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.headerCard}>
          <View style={styles.logoWrap}>
            {agency.logoUrl ? (
              <Image source={{ uri: agency.logoUrl }} style={styles.logo} />
            ) : (
              <Ionicons name="business-outline" size={28} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.agencyName}>{agency.name}</Text>
          {agency.tier !== 'basic' && (
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{TIER_LABEL[agency.tier]}</Text>
            </View>
          )}
          {agency.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={13} color={theme.colors.muted} />
              <Text style={styles.cityText}>{agency.city}</Text>
            </View>
          )}
        </View>

        {/* QUICK STATS */}
        {stats && (
          <View style={styles.quickStatsRow}>
            <Pressable style={styles.quickStat} onPress={() => goListings('sale')}>
              <Text style={styles.quickStatValue}>{stats.forSaleCount}</Text>
              <Text style={styles.quickStatLabel}>For Sale</Text>
            </Pressable>
            <Pressable style={styles.quickStat} onPress={() => goListings('rent')}>
              <Text style={styles.quickStatValue}>{stats.forRentCount}</Text>
              <Text style={styles.quickStatLabel}>For Rent</Text>
            </Pressable>
          </View>
        )}

        {/* PROPERTY TYPE BREAKDOWN */}
        {stats && stats.byPropertyType.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Properties by {agency.name}</Text>
            <View style={styles.typeGrid}>
              {stats.byPropertyType.map((t) => (
                <View key={t.propertyTypeSlug} style={styles.typeTile}>
                  <Text style={styles.typeTileLabel}>{t.label}</Text>
                  <View style={styles.typeTileRow}>
                    <Pressable onPress={() => goListings('sale', t.propertyTypeSlug)}>
                      <Text style={styles.typeTileStat}>{t.forSale} for sale</Text>
                    </Pressable>
                    <Pressable onPress={() => goListings('rent', t.propertyTypeSlug)}>
                      <Text style={styles.typeTileStat}>{t.forRent} for rent</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* STAFF */}
        {agency.staff.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agency Staff</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.staffScroll}>
              {agency.staff.map((s) => (
                <View key={s.id} style={styles.staffCard}>
                  <View style={styles.staffAvatarWrap}>
                    {s.photoUrl ? (
                      <Image source={{ uri: s.photoUrl }} style={styles.staffAvatar} />
                    ) : (
                      <Text style={styles.staffAvatarFallback}>{(s.displayName ?? '?').charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.staffName} numberOfLines={1}>{s.displayName ?? 'Unnamed'}</Text>
                  {s.title && <Text style={styles.staffTitle} numberOfLines={1}>{s.title}</Text>}
                  <View style={styles.staffActions}>
                    {/* Fixed support address — agent_profiles has no email
                        column, same constraint web's AgencyStaffCard has. */}
                    <Pressable onPress={() => Linking.openURL('mailto:hello@jayedaad.com')}>
                      <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
                    </Pressable>
                    {s.phone && (
                      <Pressable onPress={() => Linking.openURL(`tel:${s.phone}`)}>
                        <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ABOUT */}
        {agency.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {agency.name}</Text>
            <Text style={styles.aboutText}>{agency.description}</Text>
          </View>
        )}

        {/* CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact {agency.name}</Text>
          {agency.phone && (
            <Button label="Call Now" onPress={() => Linking.openURL(`tel:${agency.phone}`)} style={styles.callButton} />
          )}
          <View style={styles.form}>
            <RNTextInput style={styles.input} placeholder="Your Name" value={name} onChangeText={setName} placeholderTextColor={theme.colors.muted} />
            <RNTextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.muted}
            />
            <RNTextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.muted}
            />
            <RNTextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Message"
              value={message}
              onChangeText={setMessage}
              multiline
              placeholderTextColor={theme.colors.muted}
            />
            <Button label={submit.isPending ? 'Sending…' : 'Send Message'} onPress={handleSend} disabled={submit.isPending} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  muted: { fontSize: 13, color: theme.colors.muted },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  headerCard: { alignItems: 'center', gap: 6 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  logo: { width: '100%', height: '100%' },
  agencyName: { fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  tierBadge: { backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tierBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.bg, textTransform: 'uppercase' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityText: { fontSize: 12, color: theme.colors.muted },
  quickStatsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  quickStat: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, paddingVertical: theme.spacing.md },
  quickStatValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  quickStatLabel: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  section: { gap: theme.spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  typeGrid: { gap: theme.spacing.sm },
  typeTile: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: theme.spacing.md, gap: 4 },
  typeTileLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  typeTileRow: { flexDirection: 'row', gap: theme.spacing.lg },
  typeTileStat: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  staffScroll: { gap: theme.spacing.sm },
  staffCard: { width: 110, alignItems: 'center', gap: 4 },
  staffAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  staffAvatar: { width: '100%', height: '100%' },
  staffAvatarFallback: { fontSize: 18, fontWeight: '700', color: theme.colors.mutedLight },
  staffName: { fontSize: 12, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  staffTitle: { fontSize: 11, color: theme.colors.muted, textAlign: 'center' },
  staffActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: 2 },
  aboutText: { fontSize: 13, color: theme.colors.muted, lineHeight: 20 },
  callButton: { marginBottom: theme.spacing.sm },
  form: { gap: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
});
