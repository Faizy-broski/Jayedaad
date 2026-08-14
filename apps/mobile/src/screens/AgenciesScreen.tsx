import { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Text, TextInput as RNTextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AgencyWithStats,
  PAKISTAN_CITIES,
  useAgenciesViewModel,
  useAgencyCitiesViewModel,
} from '@jayedaad/core';
import { PickerField, refreshControlProps, theme } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

const PAGE_SIZE = 12;

// Mobile counterpart to apps/web's (public)/agents/page.tsx
// (AgenciesBrowserSection/AgenciesSearchResults) — mobile had no way to
// browse agencies at all despite useAgenciesViewModel/useAgencyDetailViewModel/
// useAgencyCitiesViewModel (packages/core) already being fully built and
// working for web, with zero mobile imports anywhere. Same curated-vs-search
// split: no filter active shows Titanium/Featured strips + browse-by-city,
// any filter active swaps to a plain paginated grid.
export function AgenciesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const hasFilters = !!city || !!search;

  const { agencies, total, isLoading, refetch, isRefetching } = useAgenciesViewModel(
    hasFilters ? { city: city || undefined, search: search || undefined, page, pageSize: PAGE_SIZE } : { page: 1, pageSize: 1 },
  );
  const {
    agencies: titanium,
    isLoading: isTitaniumLoading,
    refetch: refetchTitanium,
    isRefetching: isRefetchingTitanium,
  } = useAgenciesViewModel({ tier: 'titanium', pageSize: 10 });
  const {
    agencies: featured,
    isLoading: isFeaturedLoading,
    refetch: refetchFeatured,
    isRefetching: isRefetchingFeatured,
  } = useAgenciesViewModel({ tier: 'featured', pageSize: 8 });
  const { cities, isLoading: isCitiesLoading } = useAgencyCitiesViewModel();
  const isRefetchingCurated = isRefetchingTitanium || isRefetchingFeatured;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openAgency(slug: string) {
    navigation.navigate('AgencyDetail', { agencySlug: slug });
  }

  function renderAgencyRow(agency: AgencyWithStats) {
    return (
      <Pressable key={agency.id} style={styles.agencyRow} onPress={() => openAgency(agency.slug)}>
        <View style={styles.agencyLogoWrap}>
          {agency.logoUrl ? (
            <Image source={{ uri: agency.logoUrl }} style={styles.agencyLogo} />
          ) : (
            <Ionicons name="business-outline" size={22} color={theme.colors.primary} />
          )}
        </View>
        <View style={styles.flex1}>
          <Text style={styles.agencyName} numberOfLines={1}>{agency.name}</Text>
          <Text style={styles.agencyStats} numberOfLines={1}>
            {agency.forSaleCount} for Sale | {agency.forRentCount} for Rent
          </Text>
          <View style={styles.agencyCityRow}>
            <Ionicons name="location-outline" size={11} color={theme.colors.primary} />
            <Text style={styles.agencyCity} numberOfLines={1}>{agency.city ?? 'Pakistan'}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.searchRow}>
        <RNTextInput
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search agencies…"
          style={styles.searchInput}
        />
        <View style={styles.cityPickerWrap}>
          <PickerField
            value={city}
            options={PAKISTAN_CITIES}
            placeholder="City"
            title="Select City"
            variant="pill"
            onChange={(v) => {
              setCity(v);
              setPage(1);
            }}
          />
        </View>
      </View>

      {hasFilters ? (
        <>
          {isLoading ? (
            <Text style={styles.loading}>Loading…</Text>
          ) : (
            <FlatList
              data={agencies}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => renderAgencyRow(item)}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
              ListEmptyComponent={<Text style={styles.empty}>No agencies match your filters.</Text>}
            />
          )}
          {totalPages > 1 && (
            <View style={styles.pager}>
              <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                <Text style={[styles.pagerText, page <= 1 && styles.pagerTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={styles.pagerLabel}>Page {page} of {totalPages}</Text>
              <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                <Text style={[styles.pagerText, page >= totalPages && styles.pagerTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingCurated}
              onRefresh={() => {
                refetchTitanium();
                refetchFeatured();
              }}
              {...refreshControlProps()}
            />
          }
        >
          {!isTitaniumLoading && titanium.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Titanium Agencies</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {titanium.map((a) => (
                  <View key={a.id} style={styles.hCard}>
                    {renderAgencyRow(a)}
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {!isFeaturedLoading && featured.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Featured Agencies</Text>
              <View style={styles.grid}>{featured.map((a) => renderAgencyRow(a))}</View>
            </>
          )}

          {!isCitiesLoading && cities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Browse Agencies By City</Text>
              <View style={styles.cityGrid}>
                {cities.map((c) => (
                  <Pressable
                    key={c.city}
                    style={styles.cityTile}
                    onPress={() => {
                      setCity(c.city);
                      setPage(1);
                    }}
                  >
                    <Text style={styles.cityTileName}>{c.city}</Text>
                    <Text style={styles.cityTileCount}>{c.count} agencies</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg },
  searchInput: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text,
  },
  cityPickerWrap: { minWidth: 110 },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm },
  hScroll: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  hCard: { width: 260 },
  grid: { gap: theme.spacing.sm },
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.sm,
  },
  agencyLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  agencyLogo: { width: '100%', height: '100%' },
  flex1: { flex: 1 },
  agencyName: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  agencyStats: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  agencyCityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  agencyCity: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  cityTile: {
    width: '47%',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.md,
  },
  cityTileName: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  cityTileCount: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  pagerLabel: { fontSize: 12, color: theme.colors.muted },
  pagerText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  pagerTextDisabled: { color: theme.colors.mutedLight },
});
