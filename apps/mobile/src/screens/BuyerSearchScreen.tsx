import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteListingSearchViewModel, useSavedSearchesViewModel } from '@jayedaad/core';
import { PickerField, refreshControlProps, Spinner, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateContext';
import { PropertyCard } from '../components/PropertyCard';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { DEFAULT_SEARCH_FILTERS, SearchFilterState, SORT_OPTIONS, toListingSearchFilters } from '../lib/searchFilters';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';
import type { RootStackParamList } from '../navigation/RootNavigator';

function filterSummary(filters: SearchFilterState): string {
  const parts = [filters.purpose === 'sale' ? 'Buy' : 'Rent', filters.city || 'Any City', filters.propertyTypeSlug ? undefined : 'Any Type'];
  return parts.filter(Boolean).join(' · ');
}

// Same viewmodel as apps/web's (buyer)/search page.tsx — only the View
// differs. Full filter field set (Purpose, City, Location, Property Type,
// Area, Price, Beds, Baths, Keyword, More Options) lives in
// SearchFilterSheet, matching web's filter panel; this screen just holds
// the committed filters + renders results, same draft-then-commit split as
// AddFeaturesScreen.
export function BuyerSearchScreen() {
  const route = useRoute<RouteProp<BottomTabParamList, 'BuyerSearch'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const [filters, setFilters] = useState<SearchFilterState>({
    ...DEFAULT_SEARCH_FILTERS,
    ...route.params?.initialFilters,
  });

  // This screen lives in the bottom tab bar, so it's mounted once and kept
  // alive — re-navigating to it with new initialFilters (e.g. tapping a
  // Home category/city tile, or a purpose tab) only updates route.params,
  // it doesn't remount the component, so the useState initializer above
  // never re-runs on its own. Without this, once the Search tab had been
  // opened once, every later "jump here with these filters" navigation was
  // silently ignored and the tab just kept showing whatever filters were
  // last left active.
  useEffect(() => {
    if (route.params?.initialFilters) {
      setFilters({ ...DEFAULT_SEARCH_FILTERS, ...route.params.initialFilters });
    }
  }, [route.params?.initialFilters]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [listingNumberInput, setListingNumberInput] = useState('');
  const [listingNumber, setListingNumber] = useState<number | undefined>(undefined);
  const {
    listings,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteListingSearchViewModel({
    ...toListingSearchFilters(filters),
    listingNumber,
  });
  const { create: createSavedSearch } = useSavedSearchesViewModel();
  const { requireAuth } = useAuthGate();
  const { showToast } = useToast();

  function handleListingIdSubmit() {
    const digits = listingNumberInput.replace(/\D/g, '');
    setListingNumber(digits ? Number(digits) : undefined);
  }

  // Real backend (POST /saved-searches) previously had no caller anywhere —
  // the Favorites screen's "Saved Searches" tab could only ever show an
  // empty list. filters is the exact same ListingSearchFilters shape the
  // live search below already uses, so replaying a saved search later
  // reproduces these same results.
  function handleSaveSearch() {
    requireAuth(() => {
      createSavedSearch.mutate(
        { name: filterSummary(filters), filters: toListingSearchFilters(filters) as Record<string, unknown> },
        {
          onSuccess: () => showToast('Search saved.'),
          onError: () => showToast('Something went wrong — please try again.', 'error'),
        },
      );
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.screenTitle}>Search</Text>

      <View style={styles.searchRow}>
        <View style={styles.listingIdInputWrap}>
          <TextInput
            value={listingNumberInput}
            onChangeText={setListingNumberInput}
            onSubmitEditing={handleListingIdSubmit}
            placeholder="Search by Listing ID (e.g. JYD-00001)"
            autoCapitalize="none"
            keyboardType="number-pad"
            style={styles.listingIdInput}
          />
        </View>
        <Pressable style={styles.searchFilterIconButton} onPress={() => setSheetVisible(true)}>
          <Ionicons name="options-outline" size={20} color={theme.colors.bg} />
        </Pressable>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        <PickerField
          value={filters.sortBy}
          options={[...SORT_OPTIONS]}
          placeholder="Featured"
          title="Sort by"
          variant="pill"
          onChange={(v) => setFilters((prev) => ({ ...prev, sortBy: v as SearchFilterState['sortBy'] }))}
        />
      </View>

      <Pressable style={styles.saveSearchButton} onPress={handleSaveSearch} disabled={createSavedSearch.isPending}>
        <Ionicons name="bookmark-outline" size={16} color={theme.colors.primary} />
        <Text style={styles.saveSearchText}>{createSavedSearch.isPending ? 'Saving…' : 'Save Search'}</Text>
      </Pressable>

      <SearchFilterSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        value={filters}
        onApply={setFilters}
      />

      {isLoading && <Text style={styles.loading}>Loading…</Text>}
      {!isLoading && error && <Text style={styles.error}>Couldn't load listings — pull to refresh.</Text>}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
        ListEmptyComponent={!isLoading && !error ? <Text style={styles.empty}>No verified listings yet.</Text> : null}
        renderItem={({ item }) => (
          // Same large image-card treatment as HomeScreen's Featured/Recent
          // properties (PropertyCard) — this used to be PropertyListCard's
          // compact thumbnail row, a different, more cramped shape than the
          // rest of the app uses for listing results.
          <PropertyCard
            listing={item}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
          />
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
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  listingIdInputWrap: { flex: 1 },
  listingIdInput: { borderRadius: 999, paddingHorizontal: theme.spacing.lg },
  searchFilterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  sortLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  saveSearchText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  loading: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.md },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.lg },
  footerLoader: { marginVertical: theme.spacing.lg },
});
