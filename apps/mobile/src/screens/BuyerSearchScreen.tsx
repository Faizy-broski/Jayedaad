import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteListingSearchViewModel, usePreferencesViewModel, useSavedSearchesViewModel } from '@jayedaad/core';
import { TextInput, theme, useToast } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateContext';
import { ContactActions } from '../components/ListingContactActions';
import { PropertyCard } from '../components/PropertyCard';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { DEFAULT_SEARCH_FILTERS, SearchFilterState, toListingSearchFilters } from '../lib/searchFilters';
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const [listingNumberInput, setListingNumberInput] = useState('');
  const [listingNumber, setListingNumber] = useState<number | undefined>(undefined);
  const { listings, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteListingSearchViewModel({
    ...toListingSearchFilters(filters),
    listingNumber,
  });
  const { preferences } = usePreferencesViewModel();
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

      <TextInput
        value={listingNumberInput}
        onChangeText={setListingNumberInput}
        onSubmitEditing={handleListingIdSubmit}
        placeholder="Search by Listing ID (e.g. JYD-00001)"
        autoCapitalize="none"
        keyboardType="number-pad"
        style={styles.listingIdInput}
      />

      <Pressable style={styles.filterBar} onPress={() => setSheetVisible(true)}>
        <View style={styles.filterBarText}>
          <Text style={styles.filterSummary} numberOfLines={1}>
            {filterSummary(filters)}
          </Text>
          {(filters.area || filters.keyword) && (
            <Text style={styles.filterSubSummary} numberOfLines={1}>
              {[filters.area, filters.keyword].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
        <View style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={theme.colors.bg} />
        </View>
      </Pressable>

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

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No verified listings yet.</Text> : null}
        renderItem={({ item }) => (
          <PropertyCard
            listing={item}
            currency={preferences?.preferredCurrency}
            onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            footer={<ContactActions listing={item} />}
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
  screenTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  listingIdInput: { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterBarText: { flex: 1 },
  filterSummary: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  filterSubSummary: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  footerLoader: { marginVertical: theme.spacing.lg },
});
