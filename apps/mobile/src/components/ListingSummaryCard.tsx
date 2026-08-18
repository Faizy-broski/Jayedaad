import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Listing, useFormattedArea, useFormattedPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

export interface ListingSummaryCardProps {
  listing: Listing;
  onPress: () => void;
}

// Compact row-card for "My Listings" widgets (AgentDashboardScreen) — a
// small thumbnail + verified badge + title/location/price/stats, distinct
// from PropertyCard's full-width photo-hero treatment used on
// Home/BuyerSearch. No distance-from-you chip: this app has no geolocation
// wiring (no expo-location usage anywhere), so there's no real distance to
// show — showing one would mean fabricating a number.
export function ListingSummaryCard({ listing, onPress }: ListingSummaryCardProps) {
  const { format: formatPrice } = useFormattedPrice();
  const { format: formatArea } = useFormattedArea();
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={22} color={theme.colors.mutedLight} />
          </View>
        )}
        {listing.status === 'verified' && (
          <View style={styles.verifiedDot}>
            <Ionicons name="checkmark" size={11} color="#ffffff" />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.locationText} numberOfLines={1}>{listing.area}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(Number(listing.price))}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="bed-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.statText}>{listing.bedrooms ?? '–'} Beds</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="water-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.statText}>{listing.bathrooms ?? '–'} Baths</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="resize-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.statText}>{formatArea(Number(listing.areaValue), listing.areaUnit)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    padding: theme.spacing.sm,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  verifiedDot: {
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
    borderColor: '#ffffff',
  },
  body: { flex: 1, justifyContent: 'center', gap: 3 },
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 12, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 14, fontWeight: '800', color: theme.colors.text, marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 1 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, color: theme.colors.muted },
});
