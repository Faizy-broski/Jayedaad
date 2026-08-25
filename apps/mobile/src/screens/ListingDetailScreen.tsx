import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  PanResponder,
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
  getMaxPhoneDigits,
  leadsRepository,
  useAuthViewModel,
  useFormattedArea,
  useFormattedPrice,
  useListingDetailViewModel,
  Listing,
} from '@jayedaad/core';
import { BackButton, Badge, Button, CountryCodeField, Dialog, TextInput as UiTextInput, theme, useToast } from '@jayedaad/ui-native';
import { ContactIconActions, FavoriteButton, getPrimaryCallNumber, trackAndOpen } from '../components/ListingContactActions';
import { RootStackParamList } from '../navigation/RootNavigator';
import { addRecentlyViewed, removeRecentlyViewed } from '../lib/recentlyViewedStorage';

const { width } = Dimensions.get('window');
// Was 360 — a large fixed share of any screen regardless of device size,
// pushing badges/price/title/stats further down than the real Figma
// reference (a proportionally shorter photo area, more info above the
// fold). Every gallery-height consumer (hero pages, thumbnail strip
// position, top nav) reads off this one constant.
const GALLERY_HEIGHT = 300;
const THUMB_SIZE = 48;
const MAP_HEIGHT = 180;

// FIGMA COLORS
const FIGMA_PRIMARY = '#0F5A3E';
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
  const { listing, isLoading, error, similar } = useListingDetailViewModel(listingId);
  const { format: formatPrice } = useFormattedPrice();
  const { format: formatArea } = useFormattedArea();
  // Was an inline numberOfLines toggle (Read more/less expanded in place) —
  // now opens a real bottom sheet with the full title + description, same
  // "Title and Description" slide-up sheet the real app uses instead of
  // pushing the rest of the page down.
  const [descriptionSheetOpen, setDescriptionSheetOpen] = useState(false);
  // Modal's own built-in animationType can't be driven by a gesture, so
  // this sheet manages its own slide (animationType="none" below) the same
  // way AuthSheet.tsx already does for the login sheet — an Animated.Value
  // for the translateY, a PanResponder on a drag handle for swipe-to-
  // dismiss, and a backdrop Pressable for tap-to-dismiss. Previously the X
  // button was the ONLY way to close it.
  const descriptionSheetY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (!descriptionSheetOpen) return;
    Animated.timing(descriptionSheetY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [descriptionSheetOpen, descriptionSheetY]);

  function closeDescriptionSheet() {
    Animated.timing(descriptionSheetY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() =>
      setDescriptionSheetOpen(false),
    );
  }

  const descriptionSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) descriptionSheetY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.8) {
          closeDescriptionSheet();
        } else {
          Animated.spring(descriptionSheetY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryIntent, setEnquiryIntent] = useState<'inquiry' | 'visit'>('inquiry');

  useEffect(() => {
    if (listing) addRecentlyViewed(listing).catch(() => {});
  }, [listing]);

  useEffect(() => {
    if (error) removeRecentlyViewed(listingId).catch(() => {});
  }, [error, listingId]);

  if (error) {
    return (
      <View style={styles.loadingRoot}>
        <Ionicons name="alert-circle-outline" size={32} color={theme.colors.muted} />
        <Text style={styles.muted}>This listing is no longer available.</Text>
        <Button label="Go back" variant="secondary" size="sm" onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  }

  if (isLoading || !listing) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const price = formatPrice(Number(listing.price));
  const primaryCallNumber = getPrimaryCallNumber(listing);

  function openEnquiry(intent: 'inquiry' | 'visit') {
    setEnquiryIntent(intent);
    setEnquiryOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Gallery listing={listing} onBack={() => navigation.goBack()} />

        {/* TOP SECTION WITH BACKGROUND IMAGE */}
        <ImageBackground
          source={require('../../assets/images/feature-bg.webp')}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <View style={styles.headerContent}>
            {/* HEADER BADGES */}
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
            <Text style={styles.price}>{price}</Text>

            {/* One compact inline line, not three large shadow cards — same
                "icon + text" convention PropertyListRow.tsx already uses
                for this exact data, and matches the Figma reference's
                single-row "4 Beds 5 Baths 10 Marla" density. */}
            <View style={styles.statsRow}>
              {listing.bedrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="bed-outline" size={15} color={FIGMA_PRIMARY} />
                  <Text style={styles.statItemText}>{listing.bedrooms} Beds</Text>
                </View>
              )}
              {listing.bathrooms != null && (
                <View style={styles.statItem}>
                  <Ionicons name="water-outline" size={15} color={FIGMA_PRIMARY} />
                  <Text style={styles.statItemText}>{listing.bathrooms} Baths</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="scan-outline" size={15} color={FIGMA_PRIMARY} />
                <Text style={styles.statItemText}>{formatArea(Number(listing.areaValue), listing.areaUnit)}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* REST OF CONTENT */}
        <View style={styles.contentBody}>
          {/* ABOUT THIS PROPERTY — shown before the More Details point
              list, so the description reads first. */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description} numberOfLines={4}>
                {listing.description}
              </Text>
              <Pressable onPress={() => setDescriptionSheetOpen(true)} style={{ marginTop: 4 }}>
                <Text style={styles.link}>Read more</Text>
              </Pressable>
            </View>
          )}

          {/* MORE DETAILS */}
          <View style={styles.moreDetailsGrid}>
            {listing.kitchens != null && <DetailRow label="Kitchens" value={String(listing.kitchens)} />}
            {listing.floors != null && <DetailRow label="Floors" value={String(listing.floors)} />}
            {listing.floorLevel && <DetailRow label="Floor Level" value={listing.floorLevel} />}
            {listing.yearBuilt != null && <DetailRow label="Year Built" value={String(listing.yearBuilt)} />}
            {listing.furnishingStatus && <DetailRow label="Furnishing" value={humanizeCategory(listing.furnishingStatus)} />}
            <DetailRow label="Possession" value={listing.readyForPossession ? 'Ready' : 'Under Construction'} />
          </View>

          {/* AMENITIES — capped to 4 until "See more", same expand
              pattern as the description's Read more/less above, so a
              long amenities list doesn't push everything else (Kitchens,
              Location, Listed by) further down by default. */}
          {listing.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityChecklist}>
                {(amenitiesExpanded ? listing.amenities : listing.amenities.slice(0, 4)).map((a) => (
                  <View key={a.slug} style={styles.amenityRow}>
                    <View style={styles.amenityCheckBadge}>
                      <Ionicons name="checkmark" size={13} color={FIGMA_PRIMARY} />
                    </View>
                    <Text style={styles.amenityText}>
                      {a.label}
                      {a.value != null ? ` — ${a.value}${a.valueUnit ? ` ${a.valueUnit}` : ''}` : ''}
                      {a.textValue ? ` — ${a.textValue}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
              {listing.amenities.length > 4 && (
                <Pressable onPress={() => setAmenitiesExpanded((v) => !v)} style={{ marginTop: 4, alignSelf: 'center' }}>
                  <Text style={styles.link}>
                    {amenitiesExpanded ? 'See less' : `See ${listing.amenities.length - 4} more`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* FINANCING & INSTALLMENT PLAN */}
          {listing.installmentAvailable && (() => {
            const financingRows: { label: string; value: string }[] = [];
            if (listing.advanceAmount != null) {
              financingRows.push({ label: 'Advance / Booking Amount', value: formatPrice(listing.advanceAmount) });
            }
            if (listing.numberOfInstallments != null) {
              financingRows.push({ label: 'Number of Installments', value: String(listing.numberOfInstallments) });
            }
            if (listing.monthlyInstallment != null) {
              financingRows.push({ label: 'Monthly Installment', value: formatPrice(listing.monthlyInstallment) });
            }
            if (listing.balloonPaymentAvailable && listing.balloonPaymentAmount != null) {
              financingRows.push({ label: 'Balloon Payment', value: formatPrice(listing.balloonPaymentAmount) });
            }
            if (listing.ballotingFeeApplicable && listing.ballotingFeeAmount != null) {
              financingRows.push({ label: 'Balloting Fee', value: formatPrice(listing.ballotingFeeAmount) });
            }
            if (listing.possessionFeeApplicable && listing.possessionFeeAmount != null) {
              financingRows.push({ label: 'Possession Fee', value: formatPrice(listing.possessionFeeAmount) });
            }
            if (listing.developmentFeeApplicable && listing.developmentFeeAmount != null) {
              financingRows.push({ label: 'Development Fee', value: formatPrice(listing.developmentFeeAmount) });
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
              <ContactIconActions listing={listing} />
            </View>
          </View>

          <EnquiryDialog
            visible={enquiryOpen}
            onClose={() => setEnquiryOpen(false)}
            listingId={listing.id}
            listingTitle={listing.title}
            referenceLabel={`JYD-${String(listing.listingNumber).padStart(5, '0')}`}
            intent={enquiryIntent}
          />

          {/* TITLE AND DESCRIPTION — full-screen slide-up sheet, not an
              inline expand, confirmed against the real app's own behavior.
              Closable by the X button, tapping the dimmed backdrop, or
              swiping the handle down (animationType="none" — the slide
              itself is hand-driven, see descriptionSheetY above, so a
              gesture can actually interrupt/reverse it). */}
          <Modal
            visible={descriptionSheetOpen}
            animationType="none"
            transparent
            onRequestClose={closeDescriptionSheet}
          >
            <View style={styles.descriptionSheetBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeDescriptionSheet} />
              <Animated.View style={[styles.descriptionSheet, { transform: [{ translateY: descriptionSheetY }] }]}>
                <View {...descriptionSheetPanResponder.panHandlers}>
                  <View style={styles.descriptionSheetHandle} />
                  <View style={styles.descriptionSheetHeader}>
                    <Text style={styles.descriptionSheetHeaderTitle}>Title and Description</Text>
                    <Pressable onPress={closeDescriptionSheet} hitSlop={8}>
                      <Ionicons name="close" size={24} color={theme.colors.text} />
                    </Pressable>
                  </View>
                </View>
                <ScrollView contentContainerStyle={styles.descriptionSheetBody}>
                  <Text style={styles.descriptionSheetTitle}>{listing.title}</Text>
                  <Text style={styles.description}>{listing.description}</Text>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>

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
  const { format: formatPrice } = useFormattedPrice();
  const [index, setIndex] = useState(0);
  const media = listing.media;
  const items = media.length > 0 ? media : null;
  // Drives both directions of sync: swiping the hero updates the active
  // thumbnail (onMomentumScrollEnd below), and tapping a thumbnail scrolls
  // the hero to match (heroListRef.scrollToOffset in the thumbnail's
  // onPress) — previously the hero was a single static Image, only ever
  // changed via the thumbnail row, with no swipe gesture on the photo
  // itself at all.
  const heroListRef = useRef<FlatList>(null);

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
          <BackButton onPress={onBack} size={40} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Swipeable hero — was a single static Image only ever changed by
          tapping a thumbnail below; now a real horizontally-paged
          FlatList, one photo/video per full-width page. pagingEnabled
          snaps to whole pages on release, same native feel as a photo app.
          onMomentumScrollEnd (not onScroll) updates `index` once the swipe
          actually settles, avoiding a flood of setState calls mid-gesture. */}
      <FlatList
        ref={heroListRef}
        data={items}
        keyExtractor={(item, i) => `hero-${item.url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) =>
          item.type === 'video' ? (
            <Pressable
              style={[styles.galleryHero, styles.galleryVideo, { width, height: GALLERY_HEIGHT }]}
              onPress={() => Linking.openURL(item.url).catch(() => {})}
            >
              <Ionicons name="play-circle" size={56} color="#ffffff" />
            </Pressable>
          ) : (
            <Image source={{ uri: item.url }} style={[styles.galleryHero, { width, height: GALLERY_HEIGHT }]} />
          )
        }
      />

      {/* Gradient overlay */}
      <View style={styles.galleryGradient} pointerEvents="none" />

      {/* TOP ACTIONS */}
      <View style={styles.galleryTopNav}>
        <BackButton onPress={onBack} size={40} />
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
            <Pressable
              onPress={() => {
                setIndex(i);
                heroListRef.current?.scrollToOffset({ offset: i * width, animated: true });
              }}
            >
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SimilarCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const { format: formatPrice } = useFormattedPrice();
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
          <Text style={styles.similarPriceOverlayText}>{formatPrice(Number(listing.price))}</Text>
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
  referenceLabel,
  intent,
}: {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  // Was missing entirely — web's EnquiryDialog.tsx already builds its
  // message subject as `${title} - ID${referenceLabel}`, mobile's never
  // included the reference number at all. Now matches.
  referenceLabel: string;
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
    const subject = `${listingTitle} - ID${referenceLabel}`;
    setMessage(
      intent === 'visit'
        ? `I would like to book a visit to see ${subject}. Please let me know your available times.`
        : `I would like to inquire about your property ${subject}. Please contact me at your earliest convenience.`,
    );
  }, [visible, user, listingTitle, referenceLabel, intent]);

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

  // Updated Header Setup for Background Image
  headerBackground: {
    width: '100%',
    backgroundColor: FIGMA_SURFACE, 
  },
  headerBackgroundImage: {
    opacity: 0.05, // Further reduced to mimic a very subtle watermark for maximum readability
    resizeMode: 'cover',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    // `gap` alone spaces badgeRow/title/locationRow/listingNumber/price/
    // statsRow now — was 8 plus each child's own marginTop stacked on top
    // of it (double-spacing), which is most of what was pushing content
    // below the fold. Tightened per the Figma density comparison.
    gap: 4,
  },
  contentBody: {
    paddingHorizontal: 20,
    gap: 8,
  },

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
    top: 50, 
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

  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: theme.colors.muted },
  price: { fontSize: 26, fontWeight: '600', color: FIGMA_PRIMARY, marginTop: 4 },

  // One compact inline row (icon + "N Beds") — was three large shadowed
  // cards (103x61 each); this is the single biggest space saver in the
  // Figma density pass, same "icon + text" convention PropertyListRow.tsx
  // already uses for identical beds/baths/area data.
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  // Each stat gets its own light chip — plain inline icon+text next to
  // each other with only a small gap read as one merged run of text (hard
  // to tell "3 Beds" ends and "3 Baths" begins at a glance). A light
  // background per chip gives each one a real boundary without going back
  // to the old large shadow cards.
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: FIGMA_MUTED_BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statItemText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },

  moreDetailsGrid: { gap: 6, marginTop: 12 },
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 22 },
  link: { fontSize: 13, fontWeight: '700', color: FIGMA_PRIMARY },

  // "Title and Description" sheet — slides up over a dimmed backdrop
  // rather than expanding the description in place on the page.
  descriptionSheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  descriptionSheet: {
    maxHeight: '85%',
    backgroundColor: FIGMA_SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  // Drag handle — the visible affordance for the swipe-to-dismiss gesture
  // (see descriptionSheetPanResponder), same pill shape convention
  // AuthSheet.tsx's own drag handle uses.
  descriptionSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: FIGMA_BORDER,
    marginTop: 10,
  },
  descriptionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FIGMA_BORDER,
  },
  descriptionSheetHeaderTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  descriptionSheetBody: { padding: 20, gap: 16, paddingBottom: 32 },
  descriptionSheetTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },

  amenityChecklist: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 12 },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    borderRadius: 16,
    backgroundColor: FIGMA_SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
  },
  amenityText: { fontSize: 12, fontWeight: '700', color: FIGMA_PRIMARY, flexShrink: 1 },
  // Light green tint, not solid — same "light-bg badge with the tint's own
  // dark color icon" convention as boostBadge (#FEF3C7 amber) and
  // storyBadge (#FAE8FF purple) elsewhere on this screen.
  amenityCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E1F0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Financing table
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