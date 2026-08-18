import { useEffect, useState } from 'react';
import { Text, View, Pressable, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFavoritesViewModel, useFormattedPrice, useSavedSearchesViewModel } from '@jayedaad/core';
// Removed Tabs from ui-native import to use the premium segmented control
import { BackButton, Button, refreshControlProps, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

// Nav type unions both param lists — this screen itself now lives in
// BottomTabParamList (it's a tab), but still navigates to RootStackParamList
// screens elsewhere in the tree; same union pattern SideDrawer.tsx uses.
type Nav = NativeStackNavigationProp<RootStackParamList & BottomTabParamList>;

type TabId = 'favorites' | 'saved';

const TABS: { id: TabId; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'saved', label: 'Saved Searches' },
];

const DESTRUCTIVE_COLOR = theme.colors.danger;

export function FavoritesScreen() {
  const route = useRoute<RouteProp<BottomTabParamList, 'Favorites'>>();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<TabId>(route.params?.initialTab ?? 'favorites');

  // This screen lives in the bottom tab bar, so it's mounted once and kept
  // alive — re-navigating to it (e.g. from Profile's "Saved Searches" row)
  // only updates route.params, it doesn't remount the component, so the
  // useState initializer above never re-runs on its own. Without this,
  // tapping "Saved Searches" after already having opened "My Favourites"
  // once left the tab stuck on Favorites.
  useEffect(() => {
    if (route.params?.initialTab) setTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.titleRow}>
        <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />
        <Text style={styles.title}>Favorites</Text>
      </View>

      {/* Premium Segmented Control Header */}
      <View style={styles.header}>
        <View style={styles.segmentedControl}>
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id as TabId)}
                style={[styles.segmentTab, isActive && styles.segmentTabActive]}
              >
                <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {tab === 'favorites' ? <FavoritesTab /> : <SavedSearchesTab />}
      </View>
    </SafeAreaView>
  );
}

function FavoritesTab() {
  const { favorites, isLoading, remove, removeProject, refetch, isRefetching } = useFavoritesViewModel();
  const { format: formatPrice } = useFormattedPrice();
  const { showToast } = useToast();
  const navigation = useNavigation<Nav>();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.mutedText}>Fetching favorites…</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="heart"
        heading="No Favorites Yet"
        message="Press the ♥ icon on any property or project to add it to your favorites."
        onSearchPress={() => navigation.navigate('BuyerSearch')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
    >
      {favorites.map((favorite) => {
        const item = favorite.listing ?? favorite.project;
        const isProject = !!favorite.project;
        return (
          <Pressable
            key={favorite.id}
            style={styles.card}
            disabled={!item}
            onPress={() =>
              isProject
                ? navigation.navigate('ProjectDetail', { projectSlug: favorite.project!.slug })
                : navigation.navigate('ListingDetail', { listingId: favorite.listingId! })
            }
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item ? (isProject ? favorite.project!.name : favorite.listing!.title) : 'No longer available'}
                </Text>
                {item && (
                  <>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {item.area}, {item.city}
                    </Text>
                    {!isProject && (
                      <Text style={styles.cardPrice}>{formatPrice(Number(favorite.listing!.price))}</Text>
                    )}
                  </>
                )}
              </View>
              <Pressable
                style={styles.actionIconWrapper}
                onPress={() =>
                  isProject
                    ? removeProject.mutate(favorite.projectId!, {
                        onSuccess: () => showToast('Removed from favorites.'),
                        onError: () => showToast('Something went wrong — please try again.', 'error'),
                      })
                    : remove.mutate(favorite.listingId!, {
                        onSuccess: () => showToast('Removed from favorites.'),
                        onError: () => showToast('Something went wrong — please try again.', 'error'),
                      })
                }
                hitSlop={8}
              >
                <Ionicons name="heart" size={24} color={DESTRUCTIVE_COLOR} />
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SavedSearchesTab() {
  const { savedSearches, isLoading, remove, refetch, isRefetching } = useSavedSearchesViewModel();
  const { showToast } = useToast();
  const navigation = useNavigation<Nav>();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.mutedText}>Fetching saved searches…</Text>
      </View>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <EmptyState
        icon="search"
        heading="No Saved Searches"
        message="Save a search from the Search tab to get instantly notified about new matches."
        onSearchPress={() => navigation.navigate('BuyerSearch')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} {...refreshControlProps()} />}
    >
      {savedSearches.map((search) => (
        <View key={search.id} style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {search.name ?? 'Saved search'}
              </Text>
              <View style={styles.badge}>
                <Ionicons name="notifications-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.badgeText}>Alerts: {search.alertFrequency}</Text>
              </View>
            </View>
            <Pressable
              style={styles.actionIconWrapper}
              onPress={() =>
                remove.mutate(search.id, {
                  onSuccess: () => showToast('Saved search removed.'),
                  onError: () => showToast('Something went wrong — please try again.', 'error'),
                })
              }
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={22} color={DESTRUCTIVE_COLOR} />
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyState({
  icon,
  heading,
  message,
  onSearchPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  heading: string;
  message: string;
  onSearchPress: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={42} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyHeading}>{heading}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <View style={styles.emptyButtonWrapper}>
        <Button label="Search Properties" onPress={onSearchPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  contentContainer: {
    flex: 1,
  },
  // Matches ProjectsScreen's plain tab-title treatment — every other tab
  // screen shows some page heading by default (Home's hero header, Projects'
  // title, Profile's profile card); this screen previously jumped straight
  // into the segmented control with no heading above it.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Premium Segmented Control
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 999,
  },
  segmentTabActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  segmentTabTextActive: {
    color: theme.colors.bg,
    fontWeight: '700',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    fontSize: 14,
    color: theme.colors.mutedLight,
    fontWeight: '500',
  },

  // Premium Empty State
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyButtonWrapper: {
    width: '100%',
    paddingHorizontal: 24,
  },

  // Modern Card List
  list: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  // Specific styling for Saved Searches badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  actionIconWrapper: {
    padding: 4,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: 999,
  },
});