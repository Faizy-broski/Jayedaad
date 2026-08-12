import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  ScrollView,
  Share,
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { Accordion, Badge, Button, CountryCodeField, Dialog, TextInput as UiTextInput, theme, useToast } from '@jayedaad/ui-native';
import { ContactIconActions, FavoriteButton, getPrimaryCallNumber, trackAndOpen } from '../components/ListingContactActions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { addRecentlyViewed } from '../lib/recentlyViewedStorage';

const { width } = Dimensions.get('window');
const GALLERY_HEIGHT = 360;
const THUMB_SIZE = 48;
const MAP_HEIGHT = 180;

// FIGMA COLORS (Overrides for specific design elements)
const FIGMA_PRIMARY = '#0F5A3E'; // Deep green from the mockup
const FIGMA_SURFACE = '#FFFFFF';
const FIGMA_MUTED_BG = '#F5F7F7';
const FIGMA_BORDER = '#E5E7EB';

function humanizeCategory(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function openInMaps(lat: number, lng: number, label: string) {
  const query = encodeURIComponent(label);
  Linking.openURL(`https://maps.google.com/?q=${lat},${lng}(${query})`).catch(() => {});
}

export function ListingDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listingId } = route.params;
  const { listing, isLoading, similar } = useListingDetailViewModel(listingId);
  const { preferences } = usePreferencesViewModel();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryIntent, setEnquiryIntent] = useState<'inquiry' | 'visit'>('inquiry');

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
  const primaryCallNumber = getPrimaryCallNumber(listing);

  function openEnquiry(intent: 'inquiry' | 'visit') {
    setEnquiryIntent(intent);
    setEnquiryOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Gallery listing={listing} onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          {/* HEADER */}
          <View style={styles.badgeRow}>
            {listing.status === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
              </View>
            )}
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{listing.purpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}</Text>
            </View>
            {listing.propertyType?.label && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{listing.propertyType.label.toUpperCase()}</Text>
              </View>
            )}
            {(listing.boostTier === 'hot' || listing.boostTier === 'super_hot') && (
              <View style={styles.boostBadge}>
                <Ionicons name={listing.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={11} color="#B45309" />
                <Text style={styles.boostBadgeText}>{listing.boostTier === 'super_hot' ? 'SUPER HOT' : 'HOT'}</Text>
              </View>
            )}
            {!!listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date() && (
              <View style={styles.storyBadge}>
                <Ionicons name="film" size={11} color="#A21CAF" />
                <Text style={styles.storyBadgeText}>STORY</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.location}>
              {[listing.society, listing.subArea, listing.area, listing.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <Text style={styles.listingNumber}>JYD-{String(listing.listingNumber).padStart(5, '0')}</Text>

          <Text style={styles.price}>{price}</Text>

          {/* PRIMARY STATS */}
          <View style={styles.statsGrid}>
            {listing.bedrooms != null && <Stat icon="bed-outline" label="Beds" value={String(listing.bedrooms)} />}
            {listing.bathrooms != null && <Stat icon="water-outline" label="Baths" value={String(listing.bathrooms)} />}
            <Stat icon="resize-outline" label="Area" value={`${listing.areaValue} ${listing.areaUnit}`} />
          </View>

          {/* MORE DETAILS */}
          <View style={styles.moreDetailsGrid}>
            {listing.kitchens != null && <DetailRow label="Kitchens" value={String(listing.kitchens)} />}
            {listing.floors != null && <DetailRow label="Floors" value={String(listing.floors)} />}
            {listing.floorLevel && <DetailRow label="Floor Level" value={listing.floorLevel} />}
            {listing.yearBuilt != null && <DetailRow label="Year Built" value={String(listing.yearBuilt)} />}
            {listing.furnishingStatus && <DetailRow label="Furnishing" value={humanizeCategory(listing.furnishingStatus)} />}
            <DetailRow label="Possession" value={listing.readyForPossession ? 'Ready' : 'Under Construction'} />
          </View>

          {/* ABOUT THIS PROPERTY */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description} numberOfLines={descriptionExpanded ? undefined : 4}>
                {listing.description}
              </Text>
              <Pressable onPress={() => setDescriptionExpanded((v) => !v)} style={{ marginTop: 4 }}>
                <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
              </Pressable>
            </View>
          )}

          {/* AMENITIES */}
          {Object.keys(amenitiesByCategory).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              {Object.entries(amenitiesByCategory).map(([category, items]) => (
                <Accordion key={category} label={humanizeCategory(category)} defaultOpen={category === 'main_features'}>
                  <View style={styles.amenityChecklist}>
                    {items.map((a) => (
                      <View key={a.slug} style={styles.amenityPill}>
                        <Ionicons name="checkmark" size={16} color={FIGMA_PRIMARY} />
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

          {/* FINANCING & INSTALLMENT PLAN — rendered as a real table: a
              primary-colored "thead" bar with alternating light-primary-
              tinted row stripes below, matching the Payment Plans table on
              the project detail page. */}
          {listing.installmentAvailable && (() => {
            const financingRows: { label: string; value: string }[] = [];
            if (listing.advanceAmount != null) {
              financingRows.push({ label: 'Advance / Booking Amount', value: formatPrice(listing.advanceAmount, preferences?.preferredCurrency) });
            }
            if (listing.numberOfInstallments != null) {
              financingRows.push({ label: 'Number of Installments', value: String(listing.numberOfInstallments) });
            }
            if (listing.monthlyInstallment != null) {
              financingRows.push({ label: 'Monthly Installment', value: formatPrice(listing.monthlyInstallment, preferences?.preferredCurrency) });
            }
            if (listing.balloonPaymentAvailable && listing.balloonPaymentAmount != null) {
              financingRows.push({ label: 'Balloon Payment', value: formatPrice(listing.balloonPaymentAmount, preferences?.preferredCurrency) });
            }
            if (listing.ballotingFeeApplicable && listing.ballotingFeeAmount != null) {
              financingRows.push({ label: 'Balloting Fee', value: formatPrice(listing.ballotingFeeAmount, preferences?.preferredCurrency) });
            }
            if (listing.possessionFeeApplicable && listing.possessionFeeAmount != null) {
              financingRows.push({ label: 'Possession Fee', value: formatPrice(listing.possessionFeeAmount, preferences?.preferredCurrency) });
            }
            if (listing.developmentFeeApplicable && listing.developmentFeeAmount != null) {
              financingRows.push({ label: 'Development Fee', value: formatPrice(listing.developmentFeeAmount, preferences?.preferredCurrency) });
            }

            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financing & Installment Plan</Text>
                <View style={styles.planTableWrap}>
                  <View style={styles.planTableHeader}>
                    <Text style={styles.planTableHeaderText}>Installment Plan</Text>
                  </View>
                  {financingRows.map((row, i) => (
                    <View key={row.label} style={[styles.planTableRow, i % 2 === 1 && styles.planTableRowAlt]}>
                      <Text style={styles.financingLabel}>{row.label}</Text>
                      <Text style={styles.financingValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* LOCATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={[styles.description, { marginBottom: 12 }]}>
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
                  style={styles.docButtonSolid}
                  onPress={() => openInMaps(listing.latitude!, listing.longitude!, listing.title)}
                >
                  <Ionicons name="navigate-outline" size={16} color={FIGMA_PRIMARY} />
                  <Text style={styles.docButtonText}>Get Directions</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* LISTED BY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listed by</Text>
            <View style={styles.agentCard}>
              {listing.agent?.photoUrl ? (
                <Image source={{ uri: listing.agent.photoUrl }} style={styles.agentPhoto} />
              ) : (
                <View style={styles.agentPhotoPlaceholder}>
                  <Text style={styles.agentPhotoPlaceholderText}>
                    {(listing.agent?.displayName ?? 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.agentInfo}>
                <View style={styles.agentNameRow}>
                  <Text style={styles.agentName}>{listing.agent?.displayName ?? 'Owner'}</Text>
                  {listing.agent?.subscriptionTierName && <Badge variant="success">{listing.agent.subscriptionTierName}</Badge>}
                </View>
                <Text style={styles.agentAgency}>{listing.agent?.agency ? listing.agent.agency.name : 'Independent'}</Text>
              </View>
              <ContactIconActions listing={listing} onMessagePress={() => openEnquiry('inquiry')} />
            </View>
          </View>

          <EnquiryDialog
            visible={enquiryOpen}
            onClose={() => setEnquiryOpen(false)}
            listingId={listing.id}
            listingTitle={listing.title}
            intent={enquiryIntent}
          />

          {/* SIMILAR PROPERTIES */}
          {similar.length > 0 && (
            <View style={[styles.section, { paddingBottom: 20 }]}>
              <Text style={styles.sectionTitle}>Similar Properties</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={similar}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.similarList}
                renderItem={({ item }) => (
                  <SimilarCard
                    listing={item}
                    currency={preferences?.preferredCurrency}
                    onPress={() => navigation.push('ListingDetail', { listingId: item.id })}
                  />
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerBtn, styles.footerContactBtn]}
          onPress={() => primaryCallNumber && trackAndOpen(listing.id, 'call', `tel:${primaryCallNumber}`)}
          disabled={!primaryCallNumber}
        >
          <Ionicons name="call-outline" size={18} color={theme.colors.text} />
          <Text style={styles.footerContactText}>Contact</Text>
        </Pressable>
        <Pressable 
          style={[styles.footerBtn, styles.footerVisitBtn]} 
          onPress={() => openEnquiry('visit')}
        >
          <Ionicons name="calendar-outline" size={18} color={FIGMA_SURFACE} />
          <Text style={styles.footerVisitText}>Book a visit</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Gallery({ listing, onBack }: { listing: Listing; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const media = listing.media;
  const items = media.length > 0 ? media : null;

  async function handleShare() {
    try {
      await Share.share({
        message: `${listing.title} — ${[listing.area, listing.city].filter(Boolean).join(', ')}\n${formatPrice(Number(listing.price))}`,
      });
    } catch {
      // Ignore
    }
  }

  if (!items) {
    return (
      <View style={[styles.galleryEmpty, { height: GALLERY_HEIGHT }]}>
        <Ionicons name="image-outline" size={40} color={theme.colors.mutedLight} />
        <View style={styles.galleryTopNav}>
          <Pressable style={styles.topActionButton} onPress={onBack}><Ionicons name="chevron-back" size={20} color="#000" /></Pressable>
        </View>
      </View>
    );
  }

  const active = items[index];

  return (
    <View style={{ position: 'relative' }}>
      {active.type === 'video' ? (
        <Pressable
          style={[styles.galleryHero, styles.galleryVideo, { height: GALLERY_HEIGHT }]}
          onPress={() => Linking.openURL(active.url).catch(() => {})}
        >
          <Ionicons name="play-circle" size={56} color="#ffffff" />
        </Pressable>
      ) : (
        <Image source={{ uri: active.url }} style={[styles.galleryHero, { height: GALLERY_HEIGHT }]} />
      )}

      {/* Gradient overlay */}
      <View style={styles.galleryGradient} pointerEvents="none" />

      {/* TOP ACTIONS */}
      <View style={styles.galleryTopNav}>
        <Pressable style={styles.topActionButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={styles.galleryTopRight}>
          <Pressable style={styles.topActionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={theme.colors.text} />
          </Pressable>
          <FavoriteButton listing={listing} size={20} style={styles.topActionButton} />
        </View>
      </View>

      {items.length > 1 && (
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbStrip}
          contentContainerStyle={styles.thumbStripContent}
          renderItem={({ item, index: i }) => (
            <Pressable onPress={() => setIndex(i)}>
              {item.type === 'video' ? (
                <View style={[styles.thumb, styles.galleryVideo, i === index && styles.thumbActive]}>
                  <Ionicons name="play" size={16} color="#ffffff" />
                </View>
              ) : (
                <Image source={{ uri: item.url }} style={[styles.thumb, i === index && styles.thumbActive]} />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={FIGMA_PRIMARY} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SimilarCard({ listing, currency, onPress }: { listing: Listing; currency?: string; onPress: () => void }) {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
  const isBoosted = listing.boostTier === 'hot' || listing.boostTier === 'super_hot';
  const hasActiveStory = !!listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date();
  return (
    <Pressable style={styles.similarCard} onPress={onPress}>
      <View style={styles.similarImageWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={styles.similarImage} />
        ) : (
          <View style={[styles.similarImage, styles.galleryEmpty]}>
            <Ionicons name="image-outline" size={24} color={theme.colors.mutedLight} />
          </View>
        )}
        {listing.status === 'verified' && (
          <View style={styles.similarVerifiedBadge}>
            <Text style={styles.similarVerifiedText}>VERIFIED</Text>
          </View>
        )}
        {isBoosted && (
          <View style={[styles.similarVerifiedBadge, styles.similarBoostBadge]}>
            <Ionicons name={listing.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={9} color="#B45309" />
          </View>
        )}
        {hasActiveStory && (
          <View style={[styles.similarVerifiedBadge, styles.similarStoryBadge]}>
            <Ionicons name="film" size={9} color="#A21CAF" />
          </View>
        )}
        <FavoriteButton listing={listing} size={16} style={styles.similarFavorite} />
        <View style={styles.similarPriceOverlay}>
          <Text style={styles.similarPriceOverlayText}>{formatPrice(Number(listing.price), currency)}</Text>
        </View>
      </View>
      <View style={styles.similarBody}>
        <Text style={styles.similarTitle} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.similarSubtitle} numberOfLines={1}>{listing.city}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function EnquiryDialog({
  visible,
  onClose,
  listingId,
  listingTitle,
  intent,
}: {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  intent: 'inquiry' | 'visit';
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
    setMessage(
      intent === 'visit'
        ? `I would like to book a visit to see ${listingTitle}. Please let me know your available times.`
        : `I would like to inquire about your property ${listingTitle}. Please contact me at your earliest convenience.`,
    );
  }, [visible, user, listingTitle, intent]);

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
        isVisitRequest: intent === 'visit',
      });
      showToast(intent === 'visit' ? 'Visit request sent.' : 'Enquiry sent.');
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={visible} onClose={onClose} title={intent === 'visit' ? 'Book a Visit' : 'Send Enquiry'}>
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
  root: { flex: 1, backgroundColor: FIGMA_SURFACE },
  scrollContent: { paddingBottom: 100 }, 
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: FIGMA_SURFACE },
  muted: { fontSize: 14, color: theme.colors.mutedLight },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },

  galleryEmpty: { backgroundColor: FIGMA_MUTED_BG, alignItems: 'center', justifyContent: 'center' },
  galleryHero: { width: '100%', resizeMode: 'cover' },
  galleryVideo: { backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  galleryGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  
  galleryTopNav: {
    position: 'absolute',
    top: 50, // Accounts for status bar approx
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  galleryTopRight: { flexDirection: 'row', gap: 10 },
  topActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FIGMA_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  
  thumbStrip: { position: 'absolute', left: 16, bottom: 20 },
  thumbStripContent: { gap: 10 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  thumbActive: { borderColor: FIGMA_SURFACE },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' },
  verifiedBadge: {
    backgroundColor: FIGMA_PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', color: FIGMA_SURFACE, letterSpacing: 0.5 },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  boostBadgeText: { fontSize: 10, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },
  storyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAE8FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  storyBadgeText: { fontSize: 10, fontWeight: '800', color: '#A21CAF', letterSpacing: 0.5 },
  pillBadge: { backgroundColor: FIGMA_MUTED_BG, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  pillBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.text, letterSpacing: 0.5 },

  title: { fontSize: 24, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { fontSize: 14, color: theme.colors.muted },
  listingNumber: { fontSize: 11, color: theme.colors.mutedLight, fontWeight: '700', marginTop: 2 },
  price: { fontSize: 28, fontWeight: '900', color: FIGMA_PRIMARY, marginTop: 12 },

  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FIGMA_SURFACE,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  statLabel: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },

  moreDetailsGrid: { gap: 6, marginTop: 8 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FIGMA_BORDER,
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, color: '#475569' },
  detailValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },

  section: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.3 },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 22 },
  link: { fontSize: 13, fontWeight: '700', color: FIGMA_PRIMARY },

  amenityChecklist: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  amenityPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    width: '48%', 
    backgroundColor: FIGMA_MUTED_BG, 
    borderRadius: 999, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  amenityText: { fontSize: 13, fontWeight: '600', color: theme.colors.text, flexShrink: 1 },

  // Financing table: a primary-colored "thead" bar with alternating
  // light-primary-tinted row stripes below, matching the project detail
  // page's Payment Plans table.
  planTableWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: FIGMA_SURFACE,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  planTableHeader: {
    backgroundColor: FIGMA_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  planTableHeaderText: { fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2 },
  planTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  planTableRowAlt: { backgroundColor: 'rgba(15,90,62,0.06)' },
  financingLabel: { fontSize: 13, color: '#475569' },
  financingValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },

  map: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  docButtonSolid: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: FIGMA_MUTED_BG, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
    marginTop: 4,
  },
  docButtonText: { fontSize: 13, fontWeight: '800', color: theme.colors.text },

  // Developer / Agent Card
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FIGMA_SURFACE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  agentPhoto: { width: 52, height: 52, borderRadius: 26 },
  agentPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: FIGMA_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentPhotoPlaceholderText: { fontSize: 20, fontWeight: '800', color: FIGMA_SURFACE },
  agentInfo: { flex: 1 },
  agentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  agentName: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  agentAgency: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  enquiryForm: { gap: 16 },
  enquiryLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  enquiryPhoneRow: { flexDirection: 'row', gap: 10 },
  enquiryPhoneInput: {
    flex: 1, borderWidth: 1, borderColor: FIGMA_BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.colors.text,
  },

  // Similar Projects Cards
  similarList: { gap: 16 },
  similarCard: { width: width * 0.65 },
  similarImageWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  similarImage: { width: '100%', height: 160 },
  similarVerifiedBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: FIGMA_PRIMARY, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  similarBoostBadge: { top: 36, backgroundColor: '#FEF3C7', paddingHorizontal: 6 },
  similarStoryBadge: { top: 60, backgroundColor: '#FAE8FF', paddingHorizontal: 6 },
  similarVerifiedText: { fontSize: 9, fontWeight: '800', color: FIGMA_SURFACE, letterSpacing: 0.5 },
  similarFavorite: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: FIGMA_SURFACE, alignItems: 'center', justifyContent: 'center' },
  similarPriceOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  similarPriceOverlayText: { fontSize: 16, fontWeight: '900', color: FIGMA_SURFACE, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  similarBody: { paddingTop: 12, gap: 4 },
  similarTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  similarSubtitle: { fontSize: 13, color: theme.colors.muted },

  // Fixed Bottom Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32, 
    backgroundColor: FIGMA_SURFACE,
    borderTopWidth: 1,
    borderTopColor: FIGMA_BORDER,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
  },
  footerContactBtn: { backgroundColor: FIGMA_MUTED_BG, borderWidth: 1, borderColor: FIGMA_BORDER },
  footerContactText: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },
  footerVisitBtn: { backgroundColor: FIGMA_PRIMARY },
  footerVisitText: { color: FIGMA_SURFACE, fontWeight: '800', fontSize: 15 },
});