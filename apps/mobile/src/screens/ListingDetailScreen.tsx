import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import {
  COUNTRIES,
  formatPrice,
  getMaxPhoneDigits,
  leadsRepository,
  useAuthViewModel,
  useListingDetailViewModel,
  usePreferencesViewModel,
  Listing,
} from '@jayedaad/core';
import { Accordion, Button, CountryCodeField, Dialog, TextInput as UiTextInput, theme, useToast } from '@jayedaad/ui-native';
import { ContactActions, FavoriteButton } from '../components/ListingContactActions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { addRecentlyViewed } from '../lib/recentlyViewedStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = 280;
const MAP_HEIGHT = 180;

function humanizeCategory(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Get Directions" still deep-links to the device's own Maps app (better
// turn-by-turn than anything embeddable) — the embedded MapView above it is
// just for an at-a-glance preview, same pairing web's own Google Maps embed
// + external "Directions" link effectively gives.
function openInMaps(lat: number, lng: number, label: string) {
  const query = encodeURIComponent(label);
  Linking.openURL(`https://maps.google.com/?q=${lat},${lng}(${query})`).catch(() => {});
}

// Real, honest counterpart to apps/web's (public)/listings/[slug] page —
// that page is entirely mock-data-driven (static LISTINGS array, no
// packages/core call at all) and several of its sections (views count,
// "updated 2 days ago", nearby-places minutes, rental yield/ROI/area
// growth, reviews) are hardcoded fakes with no backing schema field. This
// screen uses the real useListingDetailViewModel (findById/findSimilar,
// previously unused anywhere) and only shows genuinely schema-backed data —
// per that decision, Investment Analysis and Reviews are omitted rather
// than faked, and Financing/Installment Plan (real CreateListingInput
// fields PostListingScreen already collects, that web's page never shows
// at all) is added as a real section instead.
export function ListingDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const { listingId } = route.params;
  const { listing, isLoading, similar } = useListingDetailViewModel(listingId);
  const { preferences } = usePreferencesViewModel();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // Backs HomeScreen's "Recent Properties" section — fire-and-forget, a
  // failed write shouldn't block viewing the listing.
  useEffect(() => {
    if (listing) addRecentlyViewed(listing).catch(() => {});
  }, [listing]);

  if (isLoading || !listing) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const price = formatPrice(Number(listing.price), preferences?.preferredCurrency);
  const amenitiesByCategory = listing.amenities.reduce<Record<string, typeof listing.amenities>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Gallery media={listing.media} />

      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.badgeRow}>
          {listing.status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          )}
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{listing.purpose === 'sale' ? 'For Sale' : 'For Rent'}</Text>
          </View>
          {listing.propertyType?.label && (
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{listing.propertyType.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <FavoriteButton listing={listing} size={24} style={styles.favoriteInline} />
        </View>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={13} color={theme.colors.muted} />{' '}
          {[listing.society, listing.subArea, listing.area, listing.city].filter(Boolean).join(', ')}
        </Text>
        <Text style={styles.listingNumber}>JYD-{String(listing.listingNumber).padStart(5, '0')}</Text>

        <Text style={styles.price}>{price}</Text>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {listing.bedrooms != null && <Stat icon="bed-outline" label="Beds" value={String(listing.bedrooms)} />}
          {listing.bathrooms != null && <Stat icon="water-outline" label="Baths" value={String(listing.bathrooms)} />}
          <Stat icon="resize-outline" label="Area" value={`${listing.areaValue} ${listing.areaUnit}`} />
          {listing.kitchens != null && <Stat icon="restaurant-outline" label="Kitchens" value={String(listing.kitchens)} />}
          {listing.floors != null && <Stat icon="layers-outline" label="Floors" value={String(listing.floors)} />}
          {listing.floorLevel && <Stat icon="layers-outline" label="Floor Level" value={listing.floorLevel} />}
          {listing.yearBuilt != null && <Stat icon="calendar-outline" label="Year Built" value={String(listing.yearBuilt)} />}
          {listing.furnishingStatus && (
            <Stat icon="cube-outline" label="Furnishing" value={humanizeCategory(listing.furnishingStatus)} />
          )}
          <Stat icon="flag-outline" label="Possession" value={listing.readyForPossession ? 'Ready' : 'Under Construction'} />
        </View>

        {/* DESCRIPTION */}
        {listing.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description} numberOfLines={descriptionExpanded ? undefined : 4}>
              {listing.description}
            </Text>
            <Pressable onPress={() => setDescriptionExpanded((v) => !v)}>
              <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
            </Pressable>
          </View>
        )}

        {/* AMENITIES — grouped by category, unlike web's flat list */}
        {Object.keys(amenitiesByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            {Object.entries(amenitiesByCategory).map(([category, items]) => (
              <Accordion key={category} label={humanizeCategory(category)} defaultOpen={category === 'main_features'}>
                <View style={styles.amenityGrid}>
                  {items.map((a) => (
                    <View key={a.slug} style={styles.amenityChip}>
                      <Ionicons name="checkmark" size={12} color={theme.colors.primary} />
                      <Text style={styles.amenityText}>
                        {a.label}
                        {a.value != null ? ` — ${a.value}${a.valueUnit ? ` ${a.valueUnit}` : ''}` : ''}
                        {a.textValue ? ` — ${a.textValue}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </Accordion>
            ))}
          </View>
        )}

        {/* FINANCING & INSTALLMENT PLAN — real fields collected at
            listing-creation time (PostListingScreen), never shown on web's
            detail page at all. */}
        {listing.installmentAvailable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financing & Installment Plan</Text>
            <View style={styles.financingGrid}>
              {listing.advanceAmount != null && (
                <FinancingRow label="Advance / Booking Amount" value={formatPrice(listing.advanceAmount, preferences?.preferredCurrency)} />
              )}
              {listing.numberOfInstallments != null && (
                <FinancingRow label="Number of Installments" value={String(listing.numberOfInstallments)} />
              )}
              {listing.monthlyInstallment != null && (
                <FinancingRow label="Monthly Installment" value={formatPrice(listing.monthlyInstallment, preferences?.preferredCurrency)} />
              )}
              {listing.balloonPaymentAvailable && listing.balloonPaymentAmount != null && (
                <FinancingRow label="Balloon Payment" value={formatPrice(listing.balloonPaymentAmount, preferences?.preferredCurrency)} />
              )}
              {listing.ballotingFeeApplicable && listing.ballotingFeeAmount != null && (
                <FinancingRow label="Balloting Fee" value={formatPrice(listing.ballotingFeeAmount, preferences?.preferredCurrency)} />
              )}
              {listing.possessionFeeApplicable && listing.possessionFeeAmount != null && (
                <FinancingRow label="Possession Fee" value={formatPrice(listing.possessionFeeAmount, preferences?.preferredCurrency)} />
              )}
              {listing.developmentFeeApplicable && listing.developmentFeeAmount != null && (
                <FinancingRow label="Development Fee" value={formatPrice(listing.developmentFeeAmount, preferences?.preferredCurrency)} />
              )}
            </View>
          </View>
        )}

        {/* LOCATION — real embedded MapView (react-native-maps) with a
            marker, plus a "Get Directions" deep-link to the device's own
            Maps app for actual navigation. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.description}>
            {[listing.society, listing.subArea, listing.area, listing.city].filter(Boolean).join(', ')}
          </Text>
          {listing.latitude != null && listing.longitude != null && (
            <>
              <MapView
                style={styles.map}
                pointerEvents="none"
                initialRegion={{
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: listing.latitude, longitude: listing.longitude }} title={listing.title} />
              </MapView>
              <Pressable
                style={styles.mapsButton}
                onPress={() => openInMaps(listing.latitude!, listing.longitude!, listing.title)}
              >
                <Ionicons name="navigate-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.mapsButtonText}>Get Directions</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* MORTGAGE CALCULATOR — real interactive math, seeded from price */}
        <MortgageCalculator price={Number(listing.price)} currency={preferences?.preferredCurrency} />

        {/* CONTACT — always shown regardless of whether an agent is
            assigned (listing.contactNumbers is independent of listing.agent
            — an owner-submitted listing with no agent still has its own
            contact numbers), unlike the old gate that hid Call/WhatsApp/SMS
            entirely whenever agent was null. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {listing.agent && (
            <View style={styles.agentCard}>
              {listing.agent.photoUrl ? (
                <Image source={{ uri: listing.agent.photoUrl }} style={styles.agentPhoto} />
              ) : (
                <View style={styles.agentPhotoPlaceholder}>
                  <Text style={styles.agentPhotoPlaceholderText}>
                    {(listing.agent.displayName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{listing.agent.displayName ?? 'Agent'}</Text>
                {listing.agent.agency && <Text style={styles.agentAgency}>{listing.agent.agency.name}</Text>}
              </View>
            </View>
          )}
          <ContactActions listing={listing} />
          <Pressable style={styles.emailButton} onPress={() => setEnquiryOpen(true)}>
            <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.emailButtonText}>Email</Text>
          </Pressable>
        </View>

        <EnquiryDialog
          visible={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          listingId={listing.id}
          listingTitle={listing.title}
        />

        {/* SIMILAR PROPERTIES */}
        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Properties</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={similar}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => <SimilarCard listing={item} currency={preferences?.preferredCurrency} />}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Gallery({ media }: { media: Listing['media'] }) {
  const [index, setIndex] = useState(0);
  const items = media.length > 0 ? media : null;

  if (!items) {
    return (
      <View style={[styles.galleryEmpty, { height: GALLERY_HEIGHT }]}>
        <Ionicons name="image-outline" size={40} color={theme.colors.mutedLight} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item }) =>
          item.type === 'video' ? (
            <Pressable style={[styles.galleryItem, styles.galleryVideo]} onPress={() => Linking.openURL(item.url).catch(() => {})}>
              <Ionicons name="play-circle" size={56} color="#ffffff" />
            </Pressable>
          ) : (
            <Image source={{ uri: item.url }} style={styles.galleryItem} />
          )
        }
      />
      {items.length > 1 && (
        <View style={styles.galleryDots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.galleryDot, i === index && styles.galleryDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FinancingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.financingRow}>
      <Text style={styles.financingLabel}>{label}</Text>
      <Text style={styles.financingValue}>{value}</Text>
    </View>
  );
}

function MortgageCalculator({ price, currency }: { price: number; currency?: string }) {
  const [loanAmount, setLoanAmount] = useState(String(Math.round(price * 0.8)));
  const [downPayment, setDownPayment] = useState(String(Math.round(price * 0.2)));
  const [interestRate, setInterestRate] = useState('14');
  const [years, setYears] = useState('20');

  const monthlyPayment = useMemo(() => {
    const principal = Number(loanAmount) || 0;
    const rate = (Number(interestRate) || 0) / 100 / 12;
    const months = (Number(years) || 0) * 12;
    if (!principal || !rate || !months) return 0;
    return (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  }, [loanAmount, interestRate, years]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mortgage Calculator</Text>
      <View style={styles.calcGrid}>
        <CalcField label="Loan Amount" value={loanAmount} onChangeText={setLoanAmount} />
        <CalcField label="Down Payment" value={downPayment} onChangeText={setDownPayment} />
        <CalcField label="Interest Rate (%)" value={interestRate} onChangeText={setInterestRate} />
        <CalcField label="Years" value={years} onChangeText={setYears} />
      </View>
      <View style={styles.calcResult}>
        <Text style={styles.calcResultLabel}>Monthly Payment</Text>
        <Text style={styles.calcResultValue}>{formatPrice(Math.round(monthlyPayment), currency)}</Text>
        <Text style={styles.calcResultHint}>Est. over {years} years</Text>
      </View>
    </View>
  );
}

function CalcField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.calcFieldWrap}>
      <Text style={styles.calcFieldLabel}>{label}</Text>
      <View style={styles.calcFieldInputWrap}>
        <RNTextInput
          style={styles.calcFieldInput}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
}

function SimilarCard({ listing, currency }: { listing: Listing; currency?: string }) {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
  return (
    <View style={styles.similarCard}>
      {cover ? (
        <Image source={{ uri: cover.url }} style={styles.similarImage} />
      ) : (
        <View style={[styles.similarImage, styles.galleryEmpty]}>
          <Ionicons name="image-outline" size={24} color={theme.colors.mutedLight} />
        </View>
      )}
      <View style={styles.similarBody}>
        <Text style={styles.similarTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.similarSubtitle} numberOfLines={1}>{listing.area}, {listing.city}</Text>
        <Text style={styles.similarPrice}>{formatPrice(Number(listing.price), currency)}</Text>
      </View>
    </View>
  );
}

// Real, previously-unwired backend (POST /crm/leads, @Public(), auto-
// assigns to the listing's agent server-side) — mirrors a real Zameen.com
// "Email" enquiry tab (Name/Email/Phone/Description, pre-filled message,
// Send). No login required (matches the endpoint's own public access), but
// prefilled from the signed-in user's name/email as a convenience.
function EnquiryDialog({
  visible,
  onClose,
  listingId,
  listingTitle,
}: {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}) {
  const { user } = useAuthViewModel();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName((user?.user_metadata?.display_name as string | undefined) ?? '');
    setEmail(user?.email ?? '');
    setMessage(`I would like to inquire about your property ${listingTitle}. Please contact me at your earliest convenience.`);
  }, [visible, user, listingTitle]);

  async function handleSend() {
    if (!name || !email || !phone || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await leadsRepository.create({
        listingId,
        name,
        email,
        phone: `+${dialCode.replace(/\D/g, '')}${phone}`,
        message,
        source: 'contact_form',
        inquirerType: 'buyer_tenant',
      });
      showToast('Enquiry sent.');
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={visible} onClose={onClose} title="Send Enquiry">
      <View style={styles.enquiryForm}>
        <UiTextInput label="Name" value={name} onChangeText={setName} />
        <UiTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <View>
          <Text style={styles.enquiryLabel}>Phone</Text>
          <View style={styles.enquiryPhoneRow}>
            <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={setDialCode} />
            <RNTextInput
              style={styles.enquiryPhoneInput}
              value={phone}
              maxLength={getMaxPhoneDigits(dialCode)}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
              keyboardType="number-pad"
              placeholder="3XXXXXXXXX"
              placeholderTextColor={theme.colors.mutedLight}
            />
          </View>
        </View>
        <UiTextInput label="Description" value={message} onChangeText={setMessage} multiline numberOfLines={4} />
        <Button label={submitting ? 'Sending…' : 'Send'} onPress={handleSend} disabled={submitting} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  muted: { fontSize: 14, color: theme.colors.mutedLight },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },

  galleryEmpty: { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  galleryItem: { width: SCREEN_WIDTH, height: GALLERY_HEIGHT },
  galleryVideo: { backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  galleryDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: theme.spacing.sm },
  galleryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  galleryDotActive: { backgroundColor: theme.colors.primary, width: 16 },

  badgeRow: { flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  pillBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.muted },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.sm },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: theme.colors.text },
  favoriteInline: { position: 'relative', top: 0, right: 0 },
  location: { fontSize: 13, color: theme.colors.muted },
  listingNumber: { fontSize: 11, color: theme.colors.mutedLight, fontWeight: '600' },
  price: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  statCard: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  statValue: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  statLabel: { fontSize: 11, color: theme.colors.muted },

  section: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amenityText: { fontSize: 12, color: theme.colors.text, fontWeight: '600' },

  financingGrid: { gap: theme.spacing.sm },
  financingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  financingLabel: { fontSize: 13, color: theme.colors.muted },
  financingValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },

  map: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mapsButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  calcFieldWrap: { width: '47%', gap: 4 },
  calcFieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase' },
  calcFieldInputWrap: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  calcFieldInput: { fontSize: 14, color: theme.colors.text },
  calcResult: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  calcResultLabel: { fontSize: 12, color: '#ffffffaa', fontWeight: '600' },
  calcResultValue: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  calcResultHint: { fontSize: 11, color: '#ffffffaa', marginTop: 2 },

  agentCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  agentPhoto: { width: 48, height: 48, borderRadius: 24 },
  agentPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentPhotoPlaceholderText: { fontSize: 18, fontWeight: '700', color: theme.colors.mutedLight },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  agentAgency: { fontSize: 12, color: theme.colors.muted },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  emailButtonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
  enquiryForm: { gap: theme.spacing.md },
  enquiryLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
  enquiryPhoneRow: { flexDirection: 'row', gap: theme.spacing.sm },
  enquiryPhoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
  },

  similarList: { gap: theme.spacing.md },
  similarCard: { width: 160 },
  similarImage: { width: 160, height: 110, borderRadius: theme.radius.md },
  similarBody: { paddingTop: 6, gap: 2 },
  similarTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  similarSubtitle: { fontSize: 11, color: theme.colors.muted },
  similarPrice: { fontSize: 13, fontWeight: '800', color: theme.colors.primary },
});
