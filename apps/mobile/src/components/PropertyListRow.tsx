import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Listing, useFormattedArea, useFormattedPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { FavoriteButton } from './ListingContactActions';

export interface PropertyListRowProps {
  listing: Listing;
  onPress: () => void;
}

// Compact horizontal result row — square thumbnail + verified badge on the
// left, details stacked on the right. Distinct from PropertyCard.tsx's
// full-bleed photo card (used on Home/detail's "Similar" rail): a results
// list this dense reads better as rows than a stack of large photo cards,
// same reasoning Zameen/Graana-style search results use a thumbnail row.
// No distance-from-user pill — this app has no geolocation/distance-calc
// anywhere, so that's a data gap, not a styling omission; add it here once
// that exists instead of showing a fake number.
export function PropertyListRow({ listing, onPress }: PropertyListRowProps) {
  const { format: formatPrice } = useFormattedPrice();
  const { format: formatArea } = useFormattedArea();
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.thumbWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbFallback]}>
            <Ionicons name="image-outline" size={20} color={theme.colors.mutedLight} />
          </View>
        )}
        {listing.status === 'verified' && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={11} color={theme.colors.bg} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <FavoriteButton listing={listing} size={17} style={styles.favoriteButton} />
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.area}
          </Text>
        </View>
        <Text style={styles.price}>{formatPrice(Number(listing.price))}</Text>
        <Text style={styles.stats} numberOfLines={1}>
          {listing.bedrooms ?? '–'} Beds · {listing.bathrooms ?? '–'} Baths ·{' '}
          {formatArea(Number(listing.areaValue), listing.areaUnit)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumbWrap: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.bg,
  },
  details: { flex: 1, justifyContent: 'center', gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  // Overrides FavoriteButton's own 36x36 circular-chip default (built for
  // floating over a photo) down to a plain small icon that fits inline next
  // to the title in this compact row.
  favoriteButton: { width: 22, height: 22, borderRadius: 0, backgroundColor: 'transparent' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  location: { fontSize: 11, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 14, fontWeight: '800', color: theme.colors.primary, marginTop: 2 },
  stats: { fontSize: 11, color: theme.colors.muted },
});
