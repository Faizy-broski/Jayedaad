import { Linking, Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { Project, ProjectStatus, projectsRepository, useFormattedPrice } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { ProjectFavoriteButton } from './ListingContactActions';
import { VerifiedBadgeIcon } from './VerifiedBadgeIcon';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

// Was calling the plain, PKR-only formatPrice() export — moved here from
// ProjectsScreen.tsx along with the card itself.
function priceRangeLabel(project: Project, format: (amount: number) => string): string | null {
  if (!project.priceRange) return null;
  const { min, max } = project.priceRange;
  if (min === max) return format(min);
  return `${format(min)} – ${format(max)}`;
}

// One anonymous id per app session, same purpose/shape as
// ListingContactActions.tsx's own viewerSessionId — kept separate since
// that file's trackAndOpen() posts to listingsRepository specifically,
// while project contact actions here use the developer's own phone/
// whatsapp (DeveloperSummary.phone/.whatsapp), not a listing's
// contactNumbers, and post to projectsRepository.trackEngagement instead.
const viewerSessionId = randomUUID();

function trackAndOpen(projectId: string, type: 'call' | 'whatsapp' | 'sms', url: string) {
  projectsRepository.trackEngagement(projectId, { type, platform: 'mobile', viewerSessionId }).catch(() => {});
  Linking.openURL(url);
}

export interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

// Compact horizontal result row — same real-app reference (Zameen's own
// project/listing search results) and the same structure as
// PropertyListRow.tsx's listing row: square thumbnail + verified badge on
// the left, details stacked on the right, ending in a real Call/WhatsApp
// row. Replaces the previous full-bleed photo card (all text overlaid on
// a dark gradient, one per row) and an even shorter-lived 2-column grid
// attempt — the user confirmed Zameen's actual row layout is the target,
// not a Daraz-style product grid.
export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { format } = useFormattedPrice();
  const price = priceRangeLabel(project, format);
  const isBoosted = project.boostTier === 'hot' || project.boostTier === 'super_hot';
  const hasActiveStory = !!project.storyExpiresAt && new Date(project.storyExpiresAt) > new Date();
  const isVerified = project.verificationStatus === 'verified';
  const { phone, whatsapp } = project.developer;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.thumbWrap}>
        {project.coverImageUrl ? (
          <Image source={{ uri: project.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbFallback]}>
            <Ionicons name="business-outline" size={24} color={theme.colors.mutedLight} />
          </View>
        )}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <VerifiedBadgeIcon size={16} />
          </View>
        )}
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{STATUS_LABELS[project.status]}</Text>
        </View>
      </View>

      <View style={styles.details}>
        {/* Grouped as one block (its own internal gap) so `details`'
            justifyContent: 'space-between' below has exactly two things to
            anchor — this block at the top, the contact row at the
            bottom — instead of spreading every individual line apart with
            its own gap and leaving dead space above the title / below the
            buttons whenever the image (now taller, see thumbWrap) is
            taller than the text content on its own. */}
        <View style={styles.infoGroup}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {project.name}
            </Text>
            <ProjectFavoriteButton project={project} size={20} style={styles.favoriteButton} />
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={theme.colors.muted} />
            <Text style={styles.location} numberOfLines={1}>
              {project.area}, {project.city}
            </Text>
          </View>
          {price && <Text style={styles.price}>{price}</Text>}

          <View style={styles.metaRow}>
            <View style={styles.developerPill}>
              <Ionicons name="business-outline" size={11} color={theme.colors.muted} />
              <Text style={styles.developerText} numberOfLines={1}>
                {project.developer.name}
              </Text>
            </View>
            {isBoosted && (
              <View style={[styles.dotBadge, styles.boostDotBadge]}>
                <Ionicons name={project.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={10} color="#B45309" />
              </View>
            )}
            {hasActiveStory && (
              <View style={[styles.dotBadge, styles.storyDotBadge]}>
                <Ionicons name="film" size={10} color="#A21CAF" />
              </View>
            )}
          </View>
          <Text style={styles.unitTypes}>
            {project.unitTypeCount} unit type{project.unitTypeCount === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Real Call/WhatsApp row, same compact treatment as
            PropertyListRow.tsx's own ContactActions — but built locally
            since the developer's phone/whatsapp (not a listing's
            contactNumbers) is the real number here. Nested inside the
            same outer Pressable as ProjectFavoriteButton above; each
            inner Pressable claims its own tap, so this never triggers
            onPress (navigate to detail). */}
        {(phone || whatsapp) && (
          <View style={styles.contactRow}>
            {phone && (
              <Pressable style={styles.callButton} onPress={() => trackAndOpen(project.id, 'call', `tel:${phone}`)}>
                <Ionicons name="call" size={14} color={theme.colors.bg} />
                <Text style={styles.callButtonText}>Call</Text>
              </Pressable>
            )}
            {phone && (
              <Pressable style={styles.smsButton} onPress={() => trackAndOpen(project.id, 'sms', `sms:${phone}`)}>
                <Text style={styles.smsButtonText}>SMS</Text>
              </Pressable>
            )}
            {whatsapp && (
              <Pressable
                style={styles.whatsappButton}
                onPress={() => trackAndOpen(project.id, 'whatsapp', `https://wa.me/${whatsapp.replace(/\D/g, '')}`)}
              >
                <Ionicons name="logo-whatsapp" size={14} color={theme.colors.bg} />
              </Pressable>
            )}
          </View>
        )}
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
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  // No fixed height/aspectRatio — `row`'s default alignItems: 'stretch'
  // makes this match whatever height `details`' real text content needs
  // instead. A hardcoded ratio (previously 0.556, measured off a real
  // Zameen screenshot) pins the image taller than our card's actual
  // content, which has fewer lines than Zameen's own card (no property-
  // type tag row — no real per-project category data exists to back one
  // honestly) — that mismatch was the dead-space gap. Still reads as
  // portrait since 140px wide content naturally runs taller than that.
  thumbWrap: {
    width: 140,
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
  statusPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: 9, fontWeight: '700', color: theme.colors.bg, letterSpacing: 0.4 },
  // No justifyContent trick needed now that thumbWrap stretches to match
  // this column's real content height (see thumbWrap) — a plain top-down
  // flow with one gap between the info block and the contact row.
  details: { flex: 1, gap: theme.spacing.sm },
  infoGroup: { gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.colors.text },
  favoriteButton: { width: 24, height: 24, borderRadius: 0, backgroundColor: 'transparent' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 13, color: theme.colors.muted, flexShrink: 1 },
  price: { fontSize: 17, fontWeight: '800', color: theme.colors.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  developerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    flexShrink: 1,
  },
  developerText: { fontSize: 11, color: theme.colors.muted, flexShrink: 1 },
  dotBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  boostDotBadge: { backgroundColor: '#FEF3C7' },
  storyDotBadge: { backgroundColor: '#FAE8FF' },
  unitTypes: { fontSize: 11, color: theme.colors.mutedLight, marginTop: 1 },
  contactRow: { flexDirection: 'row', gap: 6, marginTop: theme.spacing.xs },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 30,
    flex: 1,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
  },
  callButtonText: { fontSize: 12, fontWeight: '700', color: theme.colors.bg },
  smsButton: {
    flex: 1,
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  smsButtonText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  // flex:1 like Call/SMS — icon-only, but stretched to fill an equal
  // third of the row rather than sitting as a small fixed circle,
  // matching where PropertyListRow's own ContactActions ended up.
  whatsappButton: {
    flex: 1,
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
