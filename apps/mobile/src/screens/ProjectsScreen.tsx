import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAKISTAN_CITIES, useInfiniteProjectsViewModel } from '@jayedaad/core';
import { PickerField, refreshControlProps, Spinner, theme } from '@jayedaad/ui-native';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFilterSheet } from '../components/ProjectFilterSheet';
import { RangeFilterField } from '../components/RangeFilterField';
import { AREA_UNITS } from '../lib/searchFilters';
import { DEFAULT_PROJECT_FILTERS, ProjectFilterState, toProjectSearchFilters } from '../lib/projectFilters';
import type { RootStackParamList } from '../navigation/RootNavigator';

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

      {/* Single-column result rows, matching the real Zameen app's own
          project/listing search results (confirmed against a live
          screenshot) — same treatment as PropertyListRow.tsx's listing
          rows, not a multi-column grid. */}
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
});