import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAKISTAN_CITIES, Project, ProjectStatus, useFormattedPrice, useInfiniteProjectsViewModel } from '@jayedaad/core';
import { PickerField, refreshControlProps, Spinner, theme } from '@jayedaad/ui-native';
import { ProjectFavoriteButton } from '../components/ListingContactActions';
import { ProjectFilterSheet } from '../components/ProjectFilterSheet';
import { RangeFilterField } from '../components/RangeFilterField';
import { AREA_UNITS } from '../lib/searchFilters';
import { DEFAULT_PROJECT_FILTERS, ProjectFilterState, toProjectSearchFilters } from '../lib/projectFilters';
import type { RootStackParamList } from '../navigation/RootNavigator';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

// Was calling the plain, PKR-only formatPrice() export — every listing
// price display goes through useFormattedPrice()'s currency-aware format()
// (see ListingDetailScreen's SimilarCard for the same per-card pattern),
// but project prices never got that same treatment, so they ignored the
// user's preferredCurrency setting entirely.
function priceRangeLabel(project: Project, format: (amount: number) => string): string | null {
  if (!project.priceRange) return null;
  const { min, max } = project.priceRange;
  if (min === max) return format(min);
  return `${format(min)} – ${format(max)}`;
}

function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const { format } = useFormattedPrice();
  const price = priceRangeLabel(project, format);
  // Same boost/story badge treatment as listings' PropertyCard.tsx — a
  // buyer should recognize "this is boosted" identically whether it's a
  // listing or a project.
  const isBoosted = project.boostTier === 'hot' || project.boostTier === 'super_hot';
  const hasActiveStory = !!project.storyExpiresAt && new Date(project.storyExpiresAt) > new Date();

  // Same full-bleed photo + bottom gradient + white overlay text treatment
  // as HomeScreen's "New projects" card (and PropertyCard.tsx's listing
  // cards) — this screen previously broke from that language with a fixed-
  // height image sitting above a separate plain white text body, reading
  // as a different, older card style from the rest of the app.
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {project.coverImageUrl ? (
        <Image source={{ uri: project.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.imageFallback]}>
          <Ionicons name="business-outline" size={28} color={theme.colors.mutedLight} />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />

      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{STATUS_LABELS[project.status]}</Text>
      </View>

      {/* Top-right, since statusPill already occupies top-left. Favorite
          button always renders here; boost/story badges stack below it. */}
      <View style={styles.topRightBadgeStack}>
        <ProjectFavoriteButton project={project} size={16} style={styles.favoriteButton} />
        {isBoosted && (
          <View style={styles.boostBadge}>
            <Ionicons name={project.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={11} color="#B45309" />
            <Text style={styles.boostBadgeText}>{project.boostTier === 'super_hot' ? 'Super Hot' : 'Hot'}</Text>
          </View>
        )}
        {hasActiveStory && (
          <View style={styles.storyBadge}>
            <Ionicons name="film-outline" size={11} color="#A21CAF" />
            <Text style={styles.storyBadgeText}>Story</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.developer} numberOfLines={1}>
          {project.developer.name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {project.area}, {project.city}
        </Text>
        {price && <Text style={styles.price}>{price}</Text>}
      </View>
    </Pressable>
  );
}

// New tab (Home / Projects / Search / Favorites / Profile), backed by a real
// endpoint (projectsRepository/useProjectsViewModel) rather than mock data.
export function ProjectsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [filters, setFilters] = useState<ProjectFilterState>(DEFAULT_PROJECT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const {
    projects,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteProjectsViewModel(toProjectSearchFilters(filters));

  function set<K extends keyof ProjectFilterState>(key: K, val: ProjectFilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Projects</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBarScroll}
        contentContainerStyle={styles.filterBar}
      >
        <Pressable style={styles.filtersButton} onPress={() => setFilterSheetVisible(true)}>
          <Ionicons name="options-outline" size={16} color={theme.colors.bg} />
          <Text style={styles.filtersButtonText}>Filters</Text>
        </Pressable>

        <View style={styles.filterPill}>
          <PickerField
            value={filters.city}
            options={PAKISTAN_CITIES}
            placeholder="City"
            title="Select City"
            variant="pill"
            onChange={(v) => set('city', v)}
          />
        </View>

        <RangeFilterField
          label="Price Range"
          min={filters.minPrice}
          max={filters.maxPrice}
          isPrice
          onApply={(min, max) => setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }))}
        />

        <RangeFilterField
          label="Area"
          min={filters.minAreaValue}
          max={filters.maxAreaValue}
          unit={filters.areaUnit}
          unitOptions={AREA_UNITS}
          onUnitChange={(v) => set('areaUnit', v as ProjectFilterState['areaUnit'])}
          onApply={(min, max) => setFilters((prev) => ({ ...prev, minAreaValue: min, maxAreaValue: max }))}
        />
      </ScrollView>

      <ProjectFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        value={filters}
        onApply={setFilters}
      />

      {isLoading && <Text style={styles.loading}>Loading…</Text>}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No projects match your filters.</Text> : null}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => navigation.navigate('ProjectDetail', { projectSlug: item.slug })} />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={isFetchingNextPage ? <Spinner style={styles.footerLoader} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  // Horizontal ScrollView needs its cross-axis (height) explicitly bounded —
  // left unset, RN collapses it and clips the row's content instead of
  // sizing to the tallest pill.
  filterBarScroll: { flexGrow: 0, height: 72 }, // Updated height to fix clipping
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filtersButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.bg },
  filterPill: { minWidth: 110 },
  loading: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.md },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  footerLoader: { marginVertical: theme.spacing.lg },
  card: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageFallback: { backgroundColor: theme.colors.secondaryBg, alignItems: 'center', justifyContent: 'center' },
  statusPill: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700', color: theme.colors.bg, letterSpacing: 0.5 },
  topRightBadgeStack: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    gap: 4,
    alignItems: 'flex-end',
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  boostBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  storyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAE8FF',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  storyBadgeText: { fontSize: 10, fontWeight: '700', color: '#A21CAF' },
  favoriteButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Overlaid on the photo (bottom, over the gradient) rather than a
  // separate white section below it — matches HomeScreen's project card.
  body: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    gap: 2,
  },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.bg },
  developer: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  location: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: theme.colors.bg, marginTop: theme.spacing.xs },
});