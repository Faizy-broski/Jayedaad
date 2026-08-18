import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteListingSearchViewModel, useSavedSearchesViewModel } from '@jayedaad/core';
import { refreshControlProps, Spinner, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateContext';
import { PropertyListRow } from '../components/PropertyListRow';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { addRecentSearch, getRecentSearches, removeRecentSearch } from '../lib/recentSearchesStorage';
import { DEFAULT_SEARCH_FILTERS, SearchFilterState, SORT_OPTIONS, toListingSearchFilters } from '../lib/searchFilters';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';
import type { RootStackParamList } from '../navigation/RootNavigator';

const UNDER_5_CR = '50000000';

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
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [keywordInput, setKeywordInput] = useState(filters.keyword);
  const {
    listings,
    total,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteListingSearchViewModel(toListingSearchFilters(filters));
  const { savedSearches, create: createSavedSearch } = useSavedSearchesViewModel();
  const { requireAuth } = useAuthGate();
  const { showToast } = useToast();

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getRecentSearches().then((data) => {
        if (active) setRecentSearches(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function runKeywordSearch(keyword: string) {
    setKeywordInput(keyword);
    setFilters((prev) => ({ ...prev, keyword }));
    if (keyword.trim()) {
      addRecentSearch(keyword).then(() => getRecentSearches().then(setRecentSearches));
    }
  }

  function handleRemoveRecentSearch(keyword: string) {
    removeRecentSearch(keyword).then(() => getRecentSearches().then(setRecentSearches));
  }

  function toggleUnder5Cr() {
    setFilters((prev) => ({ ...prev, maxPrice: prev.maxPrice === UNDER_5_CR ? '' : UNDER_5_CR }));
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
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.screenTitle}>Search</Text>
              <Text style={styles.screenSubtitle}>
                {total} {total === 1 ? 'property' : 'properties'} · {savedSearches.length} saved{' '}
                {savedSearches.length === 1 ? 'search' : 'searches'}
              </Text>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchInputWrap}>
                <TextInput
                  icon="search-outline"
                  value={keywordInput}
                  onChangeText={setKeywordInput}
                  onSubmitEditing={() => runKeywordSearch(keywordInput)}
                  placeholder="Area, project, agency…"
                  returnKeyType="search"
                  variant="pill"
                />
              </View>
              <Pressable style={styles.searchFilterIconButton} onPress={() => setSheetVisible(true)}>
                <Ionicons name="options-outline" size={20} color={theme.colors.bg} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRowScroll} contentContainerStyle={styles.chipRow}>
              {/* Informational, not a toggle — every public search result is
                  already verified-only server-side (findPublic's status
                  filter), there's no "unverified" state to switch off. */}
              <View style={[styles.chip, styles.chipActive]}>
                <Text style={styles.chipTextActive}>Verified only</Text>
              </View>
              <Pressable style={[styles.chip, filters.maxPrice === UNDER_5_CR && styles.chipActive]} onPress={toggleUnder5Cr}>
                <Text style={[styles.chipText, filters.maxPrice === UNDER_5_CR && styles.chipTextActive]}>Under 5 Cr</Text>
              </Pressable>
              <Pressable style={styles.chip} onPress={() => navigation.navigate('Projects')}>
                <Text style={styles.chipText}>New projects</Text>
              </Pressable>
            </ScrollView>

            {recentSearches.length > 0 && (
              <View style={styles.recentBlock}>
                <Text style={styles.recentTitle}>Recent searches</Text>
                {recentSearches.map((keyword) => (
                  <View key={keyword} style={styles.recentRow}>
                    <Pressable style={styles.recentRowTouchable} onPress={() => runKeywordSearch(keyword)}>
                      <Ionicons name="search" size={15} color={theme.colors.muted} />
                      <Text style={styles.recentRowText} numberOfLines={1}>
                        {keyword}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleRemoveRecentSearch(keyword)} hitSlop={8}>
                      <Ionicons name="close" size={16} color={theme.colors.muted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.resultsHeaderRow}>
              <View>
                <Text style={styles.resultsCount}>{total} properties</Text>
                <Text style={styles.resultsSortLabel}>Sorted by {filters.sortBy}</Text>
              </View>
              <View style={styles.resultsHeaderActions}>
                <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Favorites')}>
                  <Ionicons name="heart-outline" size={18} color={theme.colors.text} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => setSortSheetVisible(true)}>
                  <Ionicons name="swap-vertical" size={18} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.saveSearchButton} onPress={handleSaveSearch} disabled={createSavedSearch.isPending}>
              <Ionicons name="bookmark-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.saveSearchText}>{createSavedSearch.isPending ? 'Saving…' : 'Save Search'}</Text>
            </Pressable>

            {isLoading && <Text style={styles.loading}>Loading…</Text>}
            {!isLoading && error && <Text style={styles.error}>Couldn&apos;t load listings — pull to refresh.</Text>}
          </>
        }
        ListEmptyComponent={!isLoading && !error ? <Text style={styles.empty}>No verified listings yet.</Text> : null}
        renderItem={({ item }) => (
          <PropertyListRow listing={item} onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={isFetchingNextPage ? <Spinner style={styles.footerLoader} /> : null}
      />

      <SearchFilterSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} value={filters} onApply={setFilters} />

      {sortSheetVisible && (
        <View style={styles.sortOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSortSheetVisible(false)} />
          <View style={styles.sortSheet}>
            <Text style={styles.sortSheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.sortOption}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, sortBy: option }));
                  setSortSheetVisible(false);
                }}
              >
                <Text style={styles.sortOptionText}>{option}</Text>
                {filters.sortBy === option && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  list: { padding: theme.spacing.lg, paddingTop: 0 },
  headerBlock: { paddingTop: theme.spacing.lg },
  screenTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
  screenSubtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  searchInputWrap: { flex: 1 },
  searchFilterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRowScroll: { flexGrow: 0, marginTop: theme.spacing.md },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  chipTextActive: { color: theme.colors.bg },
  recentBlock: { marginTop: theme.spacing.lg, gap: theme.spacing.xs },
  recentTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  recentRowTouchable: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
  recentRowText: { fontSize: 13, color: theme.colors.text, flexShrink: 1 },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  resultsCount: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  resultsSortLabel: { fontSize: 11, color: theme.colors.muted, marginTop: 1 },
  resultsHeaderActions: { flexDirection: 'row', gap: theme.spacing.sm },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  saveSearchText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  loading: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.lg },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  error: { color: theme.colors.danger, textAlign: 'center', marginTop: theme.spacing.lg },
  footerLoader: { marginVertical: theme.spacing.lg },
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  sortSheetTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortOptionText: { fontSize: 14, color: theme.colors.text },
});
