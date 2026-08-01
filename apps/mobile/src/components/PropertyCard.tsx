import { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Listing, formatPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { FavoriteButton } from './ListingContactActions';

export interface PropertyCardProps {
  listing: Listing;
  currency?: string;
  onPress: () => void;
  // Optional extra content rendered below the price/stats — e.g.
  // BuyerSearchScreen's Call/WhatsApp/SMS row, which HomeScreen's preview
  // cards don't need.
  footer?: ReactNode;
}

// Shared image-card treatment for a Listing — originally HomeScreen-only
// (Featured Properties), extracted so BuyerSearchScreen's results can use
// the same real photo/status-pill/price card instead of a plain bordered
// text box.
export function PropertyCard({ listing, currency, onPress, footer }: PropertyCardProps) {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];

  return (
    <Pressable style={styles.propertyCard} onPress={onPress}>
      <View style={styles.propertyImageWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.propertyImagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color={theme.colors.mutedLight} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />

        {listing.status === 'verified' && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <FavoriteButton listing={listing} size={16} style={styles.favoriteButton} />

        <View style={styles.propertyImageTextBlock}>
          <Text style={styles.propertyImageTitle} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.propertyImageLocation} numberOfLines={1}>{listing.area}, {listing.city}</Text>
        </View>
      </View>

      <View style={styles.propertyBody}>
        <Text style={styles.propertyPrice}>{formatPrice(Number(listing.price), currency)}</Text>
        <Text style={styles.propertyStatsLine}>
          {listing.bedrooms ?? '–'} Beds · {listing.bathrooms ?? '–'} Baths · {listing.areaValue} {listing.areaUnit}
        </Text>
        {footer}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  propertyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  propertyImageWrap: { height: 220 },
  propertyImagePlaceholder: { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 10, fontWeight: '600', color: theme.colors.text },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyImageTextBlock: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  propertyImageTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.bg },
  propertyImageLocation: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  propertyBody: { padding: theme.spacing.md, gap: theme.spacing.xs },
  propertyPrice: { fontWeight: '700', color: theme.colors.text, fontSize: 18 },
  propertyStatsLine: { fontSize: 13, color: theme.colors.muted },
});
