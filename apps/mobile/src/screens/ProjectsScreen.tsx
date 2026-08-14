import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAKISTAN_CITIES, Project, ProjectStatus, useFormattedPrice, useInfiniteProjectsViewModel } from '@jayedaad/core';
import { PickerField, refreshControlProps, Spinner, theme } from '@jayedaad/ui-native';
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

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {project.coverImageUrl ? (
        <Image source={{ uri: project.coverImageUrl }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Ionicons name="business-outline" size={28} color={theme.colors.muted} />
        </View>
      )}

      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{STATUS_LABELS[project.status]}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        <Text style={styles.developer} numberOfLines={1}>
          {project.developer.name}
        </Text>
        <Text style={styles.location}>
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
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: { width: '100%', height: 160 },
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
  body: { padding: theme.spacing.md, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  developer: { fontSize: 12, color: theme.colors.muted },
  location: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginTop: theme.spacing.xs },
});