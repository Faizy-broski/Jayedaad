import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing, formatPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { FavoriteButton } from './ListingContactActions';

export interface PropertyListCardProps {
  listing: Listing;
  currency?: string;
  onPress: () => void;
}

// Compact horizontal results-list row (small thumbnail + info) — the
// "normal properties card" treatment for scrollable results lists
// (BuyerSearchScreen's Search tab, AllPropertiesScreen), as opposed to
// PropertyCard's large vertical hero-image card (kept as-is for Home's
// Featured Properties and Similar-Properties carousels — a curated few, not
// a long scrollable list). Same real listing data as PropertyCard, no
// inline Call/WhatsApp/SMS row — those stay real and one tap away on
// ListingDetailScreen instead of being duplicated on every row here.
export function PropertyListCard({ listing, currency, onPress }: PropertyListCardProps) {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
  const isBoosted = listing.boostTier === 'hot' || listing.boostTier === 'super_hot';
  const hasActiveStory = !!listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={22} color={theme.colors.mutedLight} />
          </View>
        )}
        <View style={styles.topLeftBadgeStack}>
          {listing.status === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color={theme.colors.bg} />
            </View>
          )}
          {isBoosted && (
            <View style={[styles.dotBadge, styles.boostDotBadge]}>
              <Ionicons name={listing.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={10} color="#B45309" />
            </View>
          )}
          {hasActiveStory && (
            <View style={[styles.dotBadge, styles.storyDotBadge]}>
              <Ionicons name="film" size={10} color="#A21CAF" />
            </View>
          )}
        </View>
        <FavoriteButton listing={listing} size={15} style={styles.favoriteButton} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.location} numberOfLines={1}>{listing.area}, {listing.city}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(Number(listing.price), currency)}</Text>
        <Text style={styles.statsLine} numberOfLines={1}>
          {listing.bedrooms ?? '–'} Beds · {listing.bathrooms ?? '–'} Baths · {listing.areaValue} {listing.areaUnit}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: theme.spacing.md },
  thumbWrap: { position: 'relative' },
  thumb: { width: 96, height: 96, borderRadius: theme.radius.md },
  thumbPlaceholder: { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topLeftBadgeStack: { position: 'absolute', top: 6, left: 6, gap: 4 },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostDotBadge: { backgroundColor: '#FEF3C7' },
  storyDotBadge: { backgroundColor: '#FAE8FF' },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  info: { flex: 1, justifyContent: 'center', gap: 3 },
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 12, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 15, fontWeight: '800', color: theme.colors.primary, marginTop: 1 },
  statsLine: { fontSize: 11, color: theme.colors.muted },
});
