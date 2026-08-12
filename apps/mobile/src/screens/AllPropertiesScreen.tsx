import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PAKISTAN_CITIES, useInfiniteListingSearchViewModel, usePreferencesViewModel } from '@jayedaad/core';
import { PickerField, theme } from '@jayedaad/ui-native';
import { AllPropertiesFilterSheet } from '../components/AllPropertiesFilterSheet';
import { PropertyListCard } from '../components/PropertyListCard';
import { RangeFilterField } from '../components/RangeFilterField';
import { AREA_UNITS, SORT_OPTIONS } from '../lib/searchFilters';
import { AllPropertiesFilterState, DEFAULT_ALL_PROPERTIES_FILTERS, toAllPropertiesSearchFilters } from '../lib/allPropertiesFilters';
import type { RootStackParamList } from '../navigation/RootNavigator';

// "See all" destination for Home's Featured Properties — every verified
// listing (both sale and rent, no Buy/Rent split), same browse-everything
// treatment ProjectsScreen gives projects. Deliberately not the Search tab
// (BuyerSearchScreen): that screen is a dedicated Buy/Rent search tool with
// its own Save Search feature, which stays scoped to that tab only.
export function AllPropertiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AllProperties'>>();
  const [filters, setFilters] = useState<AllPropertiesFilterState>({
    ...DEFAULT_ALL_PROPERTIES_FILTERS,
    ...route.params?.initialFilters,
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Reached via navigation.navigate (not push) from Home's category/city
  // tiles — if this screen is already mounted from an earlier visit,
  // re-navigating here only updates route.params, it doesn't remount the
  // component, so the useState initializer above won't re-run on its own.
  useEffect(() => {
    if (route.params?.initialFilters) {
      setFilters({ ...DEFAULT_ALL_PROPERTIES_FILTERS, ...route.params.initialFilters });
    }
  }, [route.params?.initialFilters]);
  const { listings, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteListingSearchViewModel(
    toAllPropertiesSearchFilters(filters),
  );
  const { preferences } = usePreferencesViewModel();

  function set<K extends keyof AllPropertiesFilterState>(key: K, val: AllPropertiesFilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
          onUnitChange={(v) => set('areaUnit', v as AllPropertiesFilterState['areaUnit'])}
          onApply={(min, max) => setFilters((prev) => ({ ...prev, minAreaValue: min, maxAreaValue: max }))}
        />

        <View style={styles.filterPill}>
          <PickerField
            value={filters.sortBy}
            options={[...SORT_OPTIONS]}
            placeholder="Featured"
            title="Sort by"
            variant="pill"
            onChange={(v) => set('sortBy', v as AllPropertiesFilterState['sortBy'])}
          />
        </View>
      </ScrollView>

      <AllPropertiesFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        value={filters}
        onApply={setFilters}
      />

      {isLoading && <Text style={styles.loading}>Loading…</Text>}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No properties match your filters.</Text> : null}
        renderItem={({ item }) => (
          <PropertyListCard
            listing={item}
            currency={preferences?.preferredCurrency}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={theme.colors.primary} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  filterBarScroll: { flexGrow: 0, height: 72 },
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
