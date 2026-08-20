import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Listing, useFormattedArea, useFormattedPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { ContactActions, FavoriteButton } from './ListingContactActions';
import { VerifiedBadgeIcon } from './VerifiedBadgeIcon';

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
  // Same spent-credit badges Home's PropertyCard.tsx (and now
  // ProjectCard.tsx) already show — this row never surfaced them at all,
  // so an agent's Hot/Super Hot/Story credit spend was invisible here.
  const isBoosted = listing.boostTier === 'hot' || listing.boostTier === 'super_hot';
  const hasActiveStory = !!listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date();

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
          // Opaque white backing behind the icon — it's a thin green
          // outline glyph with no fill, so directly on a photo of unknown
          // color it can disappear; a solid disc keeps it legible on any
          // thumbnail, same reasoning the pre-icon-swap badge's colored
          // circle background already covered.
          <View style={styles.verifiedBadge}>
            <VerifiedBadgeIcon size={16} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        {(isBoosted || hasActiveStory) && (
          // Labeled, not icon-only — and in the details column, not on the
          // thumbnail: the 112px-wide thumbnail has no room next to the
          // Verified badge for a full "Super Hot" text pill without
          // clipping or overlapping it. Matches Home's PropertyCard.tsx
          // wording exactly, same "TITANIUM/tier badges live in the text
          // column, not on the photo" layout the real Zameen app uses.
          <View style={styles.badgeRow}>
            {isBoosted && (
              <View style={styles.boostBadge}>
                <Ionicons name={listing.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={10} color="#B45309" />
                <Text style={styles.boostBadgeText}>{listing.boostTier === 'super_hot' ? 'Super Hot' : 'Hot'}</Text>
              </View>
            )}
            {hasActiveStory && (
              <View style={styles.storyBadge}>
                <Ionicons name="film-outline" size={10} color="#A21CAF" />
                <Text style={styles.storyBadgeText}>Story</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <FavoriteButton listing={listing} size={20} style={styles.favoriteButton} />
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={theme.colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.area}
          </Text>
        </View>
        <Text style={styles.price}>{formatPrice(Number(listing.price))}</Text>
        <Text style={styles.stats} numberOfLines={1}>
          {listing.bedrooms ?? '–'} Beds · {listing.bathrooms ?? '–'} Baths ·{' '}
          {formatArea(Number(listing.areaValue), listing.areaUnit)}
        </Text>
        {/* Real Call/WhatsApp/SMS row, confirmed on the live Zameen app's
            own search results cards — small, inline with the rest of this
            column rather than a separate full-width row under the photo.
            Nested inside the same outer Pressable as FavoriteButton above;
            RN's touch responder system gives each inner Pressable its own
            tap, so this never triggers onPress (navigate to detail). */}
        <ContactActions listing={listing} size="compact" />
      </View>
    </Pressable>
  );
}

// Row + thumbnail + text all bumped up a size from the original compact
// dimensions — on a real phone width the old 84px thumbnail and 11-14px
// text left most of the row as bare whitespace instead of content.
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumbWrap: {
    width: 112,
    height: 112,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
  },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, justifyContent: 'center', gap: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  boostBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  storyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAE8FF',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  storyBadgeText: { fontSize: 10, fontWeight: '700', color: '#A21CAF' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.colors.text },
  // Overrides FavoriteButton's own 36x36 circular-chip default (built for
  // floating over a photo) down to a plain icon that fits inline next
  // to the title in this row.
  favoriteButton: { width: 24, height: 24, borderRadius: 0, backgroundColor: 'transparent' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 13, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 17, fontWeight: '800', color: theme.colors.primary, marginTop: 2 },
  stats: { fontSize: 12.5, color: theme.colors.muted },
});
