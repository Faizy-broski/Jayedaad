import { memo, useCallback, useState } from 'react';
import { FlatList, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueries } from '@tanstack/react-query';
import {
  BlogPost,
  Listing,
  Project,
  ProjectStatus,
  formatPrice,
  listingsRepository,
  useAuthViewModel,
  useBlogViewModel,
  useListingSearchViewModel,
  usePreferencesViewModel,
  useProjectsViewModel,
} from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import { PropertyCard } from '../components/PropertyCard';
import { SideDrawer } from '../components/SideDrawer';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { DEFAULT_SEARCH_FILTERS, SearchFilterState } from '../lib/searchFilters';
import { getRecentlyViewed } from '../lib/recentlyViewedStorage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';
import heroLogoImage from '../../assets/images/hero-logo.webp';
import heroBannerImage from '../../assets/images/home-banner.webp';
import lahoreImage from '../../assets/images/lahore.webp';
import karachiImage from '../../assets/images/karachi.webp';
import islamabadImage from '../../assets/images/islamabad.webp';
import dhaImage from '../../assets/images/DHA.webp';
import bahriaImage from '../../assets/images/bahria.webp';
import gulbergImage from '../../assets/images/gulberg.webp';

// Purpose is a real ListingPurpose ('sale'|'rent') — "Commercial" was never
// a valid purpose (see purposeToFilters below), it's a Property Type
// category, so it's not offered here as a third tab anymore.
type Purpose = 'Buy' | 'Rent';
const PURPOSE_TABS: { value: Purpose; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'Buy', icon: 'home' },
  { value: 'Rent', icon: 'key' },
];

// isArea: lahore/karachi/islamabad are real `city` column values; DHA/
// Bahria/Gulberg are real neighborhoods that span multiple cities, so they
// filter on the `area` column instead — both are genuine ListingSearchFilters
// fields, just scoped to whichever one actually matches how the value is
// stored on a listing.
type Category = { id: string; title: string; image: number; isArea?: boolean };

// Icons here map to real property-type slugs from the taxonomy (Homes/Plots/
// Commercial categories, supabase/migrations/0005_taxonomy_seed.sql) — House,
// Flat/Apartment, Farm House under "residential"; Office, Shop under
// "commercial"; the Plots tile represents the "plot" category as a whole
// (residential_plot, agricultural_land, etc.), same category-level
// representation already used for HomeHeader's Commercial purpose tab.
type PropertyCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROPERTY_CATEGORIES: PropertyCategory[] = [
  { id: 'house', title: 'Homes', icon: 'home' },
  { id: 'flat', title: 'Apartments', icon: 'business' },
  { id: 'residential_plot', title: 'Plots', icon: 'flag' },
  { id: 'office', title: 'Offices', icon: 'briefcase' },
  { id: 'shop', title: 'Shops', icon: 'storefront' },
  { id: 'farm_house', title: 'Farmhouse', icon: 'leaf' },
];

const CITIES: Category[] = [
  { id: 'lahore', title: 'Lahore', image: lahoreImage },
  { id: 'karachi', title: 'Karachi', image: karachiImage },
  { id: 'islamabad', title: 'Islamabad', image: islamabadImage },
  { id: 'dha', title: 'DHA', image: dhaImage, isArea: true },
  { id: 'bahria', title: 'Bahria', image: bahriaImage, isArea: true },
  { id: 'gulberg', title: 'Gulberg', image: gulbergImage, isArea: true },
];

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

function projectPriceLabel(project: Project): string | null {
  if (!project.priceRange) return null;
  return `From ${formatPrice(project.priceRange.min)}`;
}

// Hero-photo header (see HomeHeader below) followed by featured properties,
// browse-by-category, cities, about, and stats sections.
export const HomeScreen = memo(function HomeScreen() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  // Previously FEATURED_PROPERTIES was hardcoded mock data (same as web's
  // homepage, which also pulls from a static array) — real verified
  // listings, newest first, so the cards are actually tappable to a real
  // ListingDetailScreen instead of dead-ending on fake ids.
  const { listings: featuredListings, isLoading: featuredLoading } = useListingSearchViewModel({
    sortBy: 'newest',
    pageSize: 4,
  });
  // Previously NEW_PROJECTS was hardcoded mock data — real verified
  // projects, newest first, tappable to the real ProjectDetailScreen.
  const { projects: newProjects } = useProjectsViewModel({ sortBy: 'newest', pageSize: 4 });
  const { preferences } = usePreferencesViewModel();
  // Previously BLOG_POSTS was hardcoded mock data — real published posts
  // from the Blog CMS, newest first.
  const { posts: blogPosts, isLoading: blogLoading } = useBlogViewModel({ limit: 3 });

  // No buyer-side view-history backend exists — tracked on-device instead
  // (ListingDetailScreen writes to it on view). Re-read on every focus, not
  // just mount, so coming back from viewing a listing shows it here right
  // away instead of needing an app restart.
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getRecentlyViewed().then((data) => {
        if (active) setRecentListings(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // Real per-category/per-location listing counts — previously hardcoded
  // strings ("12,480", "1,240 listings"). One lightweight count-only query
  // per tile (pageSize: 1, only `total` is read) rather than a bare array
  // map, since these are a fixed, known set of tiles, not dynamic data.
  const categoryCountQueries = useQueries({
    queries: PROPERTY_CATEGORIES.map((category) => ({
      queryKey: ['listings', 'public', 'count', 'propertyType', category.id],
      queryFn: () => listingsRepository.searchPublic({ propertyTypeSlug: category.id, pageSize: 1 }),
    })),
  });
  const cityCountQueries = useQueries({
    queries: CITIES.map((city) => ({
      queryKey: ['listings', 'public', 'count', city.isArea ? 'area' : 'city', city.title],
      queryFn: () =>
        listingsRepository.searchPublic(city.isArea ? { area: city.title, pageSize: 1 } : { city: city.title, pageSize: 1 }),
    })),
  });

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      {/* HomeHeader (photo, search bar, Buy/Rent) now scrolls away with the
          rest of the page — it used to be a sibling rendered before
          ScrollView, which pinned it fixed at the top while only the
          sections below it scrolled underneath. */}
      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        <HomeHeader onMenuPress={() => setDrawerVisible(true)} />

        {/* Placed immediately below the Buy/Rent toggle in HomeHeader for
            quick access — client requirement: Browse by Categories is the
            first section on both platforms. */}
        <View style={styles.sectionCard}>
          <Text style={styles.browseCategoryTitle}>Browse by category</Text>

          <View style={styles.propertyCategoryGrid}>
            {PROPERTY_CATEGORIES.map((category, i) => (
              <PropertyCategoryCard
                key={category.id}
                category={category}
                count={categoryCountQueries[i].data?.total ?? 0}
                onPress={() =>
                  navigation.navigate('AllProperties', { initialFilters: { propertyTypeSlug: category.id } })
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Featured properties</Text>
              <Text style={styles.sectionSubtitleTight}>Hand-picked, fully verified</Text>
            </View>
            <Pressable style={styles.seeAllRow} onPress={() => navigation.navigate('AllProperties')}>
              <Text style={styles.viewAllLink}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
            </Pressable>
          </View>

          <View style={styles.propertyListVertical}>
            {featuredLoading ? (
              <Text style={styles.mutedText}>Loading…</Text>
            ) : featuredListings.length === 0 ? (
              <Text style={styles.mutedText}>No listings yet.</Text>
            ) : (
              featuredListings.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  currency={preferences?.preferredCurrency}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
                />
              ))
            )}
          </View>
        </View>

        {/* On-device view history (see recentlyViewedStorage.ts) — hidden
            entirely rather than shown empty, since a fresh install/new
            buyer has nothing to "continue" yet. */}
        {recentListings.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Recent properties</Text>
                <Text style={styles.sectionSubtitleTight}>Continue where you left off</Text>
              </View>
            </View>

            <View style={styles.propertyListVertical}>
              {recentListings.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  currency={preferences?.preferredCurrency}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Popular locations</Text>
              <Text style={styles.sectionSubtitleTight}>Where Pakistan is buying</Text>
            </View>
          </View>

          <FlatList
            data={CITIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cityList}
            renderItem={({ item, index }) => (
              <CategoryCard
                category={item}
                listingsCount={cityCountQueries[index].data?.total ?? 0}
                onPress={() =>
                  navigation.navigate(
                    'AllProperties',
                    { initialFilters: item.isArea ? { area: item.title } : { city: item.title } },
                  )
                }
              />
            )}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>New projects</Text>
              <Text style={styles.sectionSubtitleTight}>Off-plan and pre-launch</Text>
            </View>
            <Pressable style={styles.seeAllRow} onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.viewAllLink}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
            </Pressable>
          </View>

          <FlatList
            data={newProjects}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.projectList}
            renderItem={({ item }) => (
              <ProjectCard project={item} onPress={() => navigation.navigate('ProjectDetail', { projectSlug: item.slug })} />
            )}
          />
        </View>

        {(blogLoading || blogPosts.length > 0) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.blogTitle}>Property tips</Text>
                <Text style={styles.sectionSubtitleTight}>Read before you sign</Text>
              </View>
              <Pressable style={styles.seeAllRow} onPress={() => navigation.navigate('BlogList')}>
                <Text style={styles.viewAllLink}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
              </Pressable>
            </View>

            <View style={styles.blogList}>
              {blogPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  onPress={() => navigation.navigate('BlogDetail', { slug: post.slug })}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

// Hero photo (home-banner.webp) + dark gradient replaces the old flat-color
// header — logo top-left, hamburger+bell grouped top-right (the reference
// this was redesigned from has no hamburger at all, but it's the only way to
// reach SideDrawer's Favorites/My Properties/Post Listing/logout, none of
// which live on the bottom tabs, so it stays, restyled to sit on the photo
// instead of the old solid bar), a greeting + "{name}, find your address"
// headline, and a location row — all clipped inside the rounded-bottom photo
// block. The search bar + Buy/Rent/Commercial tabs are a separate sibling
// with a negative top margin so they float, straddling the seam between the
// photo and the white content below (previously they were rendered INSIDE
// the photo's overflow:hidden clip, which is why they never reached the
// white background at all) — z-order comes for free from paint order (this
// block is the later sibling), no explicit zIndex needed.
function HomeHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const { user, isAuthenticated } = useAuthViewModel();
  const [purpose, setPurpose] = useState<Purpose>('Buy');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  // enabled effectively no-op (empty result) for a signed-out user — the
  // dot below just never shows. Real unread count, was previously a
  // permanently-on hardcoded dot with no onPress at all.
  const { unreadCount } = useNotificationsViewModel();

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const firstName = displayName?.split(' ')[0];

  function purposeToFilters(p: Purpose): Partial<SearchFilterState> {
    return { purpose: p === 'Rent' ? 'rent' : 'sale' };
  }

  return (
    <View style={styles.headerOuter}>
      <View style={styles.headerPhotoClip}>
        <Image source={heroBannerImage} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['rgba(3,20,15,0.75)', 'rgba(3,20,15,0.55)', 'rgba(3,20,15,0.88)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.headerContent, { paddingTop: insets.top + theme.spacing.md }]}>
          <View style={styles.headerTopRow}>
            <Image source={heroLogoImage} style={styles.headerLogo} contentFit="contain" />
            <View style={styles.headerTopIcons}>
              <Pressable style={styles.headerIconButton} onPress={onMenuPress} hitSlop={8}>
                <Ionicons name="menu" size={18} color={theme.colors.bg} />
              </Pressable>
              <Pressable style={styles.headerIconButton} hitSlop={8}>
                <Ionicons name="notifications-outline" size={18} color={theme.colors.bg} />
                <View style={styles.headerNotificationDot} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.greeting}>Assalam-o-Alaikum 👋</Text>
          <Text style={styles.headline}>{firstName ? `${firstName}, find your address` : 'Find your address'}</Text>
          <View style={styles.headerLocationRow}>
            <Ionicons name="location" size={14} color={theme.colors.bg} />
            <Text style={styles.headerLocationText}>Lahore, Punjab</Text>
          </View>
        </View>
      </View>

      {/* Transparent wrap (no background of its own) so the negative
          marginTop pulls just the opaque white search pill up over the
          still-visible photo behind it — this block previously had its own
          opaque white background, which masked the photo in the overlap
          zone and made the bar look like it was sitting flush below the
          banner instead of floating over it. */}
      <View style={styles.searchBarFloatWrap}>
        <View style={styles.searchBar}>
          <Pressable
            style={styles.searchBarTextArea}
            onPress={() => navigation.navigate('BuyerSearch', { initialFilters: purposeToFilters(purpose) })}
          >
            <Ionicons name="search" size={16} color={theme.colors.muted} />
            <Text style={styles.searchPlaceholder}>Search area, project or agency...</Text>
          </Pressable>
          <Pressable onPress={() => setFilterSheetVisible(true)} hitSlop={8} style={styles.searchFilterGlow}>
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={styles.searchFilterButton}
            >
              <Ionicons name="options-outline" size={18} color={theme.colors.bg} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={styles.purposeRowWrap}>
        <View style={styles.purposeRow}>
          {PURPOSE_TABS.map(({ value, icon }) => {
            const active = value === purpose;
            return (
              <Pressable
                key={value}
                onPress={() => setPurpose(value)}
                style={[styles.purposeTab, active && styles.purposeTabActive]}
              >
                <Ionicons name={icon} size={15} color={active ? theme.colors.primary : theme.colors.muted} />
                <Text style={[styles.purposeText, active && styles.purposeTextActive]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SearchFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        value={{ ...DEFAULT_SEARCH_FILTERS, ...purposeToFilters(purpose) }}
        onApply={(applied) => navigation.navigate('BuyerSearch', { initialFilters: applied })}
      />
    </View>
  );
}

function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const price = projectPriceLabel(project);

  return (
    <Pressable style={styles.projectCard} onPress={onPress}>
      {project.coverImageUrl ? (
        <Image source={{ uri: project.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.propertyImagePlaceholder]}>
          <Ionicons name="business-outline" size={28} color={theme.colors.mutedLight} />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />

      <View style={styles.projectStatusPill}>
        <Text style={styles.projectStatusText}>{PROJECT_STATUS_LABELS[project.status]}</Text>
      </View>

      <View style={styles.projectTextBlock}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectDeveloper}>{project.developer.name}</Text>
        {price && <Text style={styles.projectPrice}>{price}</Text>}
      </View>
    </Pressable>
  );
}

// Soft organic "blob" behind the icon circle — no blob-path/SVG library in
// this app, so it's approximated with two overlapping low-opacity tinted
// circles (a bigger pale one, a smaller mid-tone one offset toward a
// corner), clipped by the card's own overflow:hidden bounds, which reads
// as the same soft-gradient-blob look without hand-rolled SVG paths.
function PropertyCategoryCard({
  category,
  count,
  onPress,
}: {
  category: PropertyCategory;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.propertyCategoryCard} onPress={onPress}>
      <View style={styles.propertyCategoryIconWrap}>
        <View style={styles.propertyCategoryBlobBack} />
        <View style={styles.propertyCategoryBlobFront} />
        <View style={styles.propertyCategoryIconCircle}>
          <Ionicons name={category.icon} size={26} color={theme.colors.primary} />
        </View>
      </View>
      <Text style={styles.propertyCategoryTitle}>{category.title}</Text>
      <Text style={styles.propertyCategoryCount}>{count.toLocaleString('en-PK')}</Text>
    </Pressable>
  );
}

function CategoryCard({
  category,
  listingsCount,
  onPress,
}: {
  category: Category;
  listingsCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.categoryCard} onPress={onPress}>
      <Image source={category.image} style={styles.categoryImage} contentFit="cover" transition={150} />
      <LinearGradient
        colors={['transparent', 'rgba(15,23,42,0.85)']}
        style={styles.categoryGradient}
      />
      <View style={styles.categoryTextRow}>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <Text style={styles.categoryListings}>{listingsCount.toLocaleString('en-PK')} listings</Text>
      </View>
    </Pressable>
  );
}

// Same soft-blob decoration technique as PropertyCategoryCard (two
// overlapping low-opacity tinted circles, clipped by the card's own
// overflow:hidden) — here sitting behind the text column instead of behind
// an icon.
function BlogCard({ post, onPress }: { post: BlogPost; onPress: () => void }) {
  return (
    <Pressable style={styles.blogCard} onPress={onPress}>
      <View style={styles.blogBlobBack} />
      <View style={styles.blogBlobFront} />
      {post.coverImageUrl ? (
        <Image source={{ uri: post.coverImageUrl }} style={styles.blogThumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.blogThumb, styles.blogThumbPlaceholder]}>
          <Ionicons name="newspaper-outline" size={20} color={theme.colors.muted} />
        </View>
      )}
      <View style={styles.blogBody}>
        {post.category && (
          <View style={styles.blogTag}>
            <Text style={styles.blogTagText}>{post.category.name}</Text>
          </View>
        )}
        <Text style={styles.blogPostTitle} numberOfLines={2}>
          {post.title}
        </Text>
        {post.readTime && <Text style={styles.blogReadTime}>{post.readTime}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scrollBody: { flex: 1 },
  scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionCard: {
    backgroundColor: theme.colors.bg,
    borderRadius: 20,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statsCard: { overflow: 'hidden', padding: 0 },
  // Cancels out scrollContent's own padding so the header stays full-bleed
  // edge-to-edge now that it's the ScrollView's first child rather than a
  // sibling rendered outside the padded content area.
  headerOuter: {
    backgroundColor: theme.colors.bg,
    marginTop: -theme.spacing.md,
    marginHorizontal: -theme.spacing.md,
  },
  headerPhotoClip: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerLogo: { width: 108, height: 72 },
  headerTopIcons: { flexDirection: 'row', gap: theme.spacing.sm },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNotificationDot: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: theme.colors.bg,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 2 },
  headline: { color: theme.colors.bg, fontSize: 26, fontWeight: '800', marginBottom: theme.spacing.sm },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.lg,
  },
  headerLocationText: { color: theme.colors.bg, fontSize: 13, fontWeight: '600' },
  // Deliberately transparent — only the searchBar pill itself is opaque, so
  // the photo still shows through the rest of this wrap. Negative marginTop
  // pulls it up so roughly half the pill sits over headerPhotoClip's photo
  // and half over the white area below; it's a later sibling of
  // headerPhotoClip so it paints on top (zIndex set anyway for Android's
  // stacking-context quirks with negative-margin siblings).
  searchBarFloatWrap: {
    marginTop: -30,
    paddingHorizontal: theme.spacing.lg,
    zIndex: 2,
  },
  purposeRowWrap: {
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 30,
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchBarTextArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  searchPlaceholder: { flex: 1, color: theme.colors.muted, fontSize: 13 },
  // Soft green halo behind the gradient button, echoing the glowing
  // search-FAB reference — a semi-transparent tinted circle sized larger
  // than the button itself, plus a colored iOS shadow (Android falls back
  // to the halo circle alone, since elevation shadows are always neutral).
  searchFilterGlow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(13,99,75,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  searchFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  purposeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  purposeTabActive: {
    backgroundColor: theme.colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  purposeText: { color: theme.colors.muted, fontWeight: '600', fontSize: 14 },
  purposeTextActive: { color: theme.colors.text, fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionHeaderText: { flexShrink: 1 },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: theme.spacing.xs },
  viewAllLink: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  sectionSubtitleTight: { fontSize: 13, color: theme.colors.muted, marginTop: 2, marginBottom: theme.spacing.lg },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  propertyListVertical: { gap: theme.spacing.md },
  propertyImagePlaceholder: { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  mutedText: { fontSize: 13, color: theme.colors.mutedLight, textAlign: 'center', paddingVertical: theme.spacing.lg },
  projectList: { gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  projectCard: {
    width: 250,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
  },
  projectStatusPill: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  projectStatusText: { fontSize: 10, fontWeight: '700', color: theme.colors.bg, letterSpacing: 0.5 },
  projectTextBlock: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  projectName: { fontSize: 17, fontWeight: '700', color: theme.colors.bg },
  projectDeveloper: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  projectPrice: { fontSize: 14, fontWeight: '700', color: theme.colors.bg, marginTop: theme.spacing.sm },
  browseCategoryTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.lg },
  propertyCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  propertyCategoryCard: {
    // Explicit % width + space-between (no `gap`) — `gap` was stacking on
    // top of the space-between-derived spacing and pushing the 3rd column
    // of every row past 100%, wrapping it down to a new row instead
    // (2 cols x 3 rows instead of 3 cols x 2 rows).
    width: '31%',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 20,
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  propertyCategoryIconWrap: {
    width: '100%',
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3EE',
    marginBottom: theme.spacing.sm,
  },
  propertyCategoryBlobBack: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    top: -20,
    left: -10,
    backgroundColor: 'rgba(13,99,75,0.10)',
  },
  propertyCategoryBlobFront: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    bottom: -24,
    right: -8,
    backgroundColor: 'rgba(13,99,75,0.14)',
  },
  propertyCategoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  propertyCategoryTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  propertyCategoryCount: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  cityList: { gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  blogTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  blogList: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: 20,
    padding: theme.spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  blogBlobBack: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -50,
    backgroundColor: 'rgba(13,99,75,0.06)',
  },
  blogBlobFront: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -40,
    right: -20,
    backgroundColor: 'rgba(13,99,75,0.08)',
  },
  blogThumb: { width: 64, height: 64, borderRadius: 14 },
  blogThumbPlaceholder: { backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' },
  blogBody: { flex: 1, gap: 4 },
  blogTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: theme.colors.bg,
  },
  blogTagText: { fontSize: 11, fontWeight: '600', color: theme.colors.text },
  blogPostTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, lineHeight: 19 },
  blogReadTime: { fontSize: 12, color: theme.colors.muted },
  categoryCard: {
    width: 168,
    aspectRatio: 0.82,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  categoryImage: { ...StyleSheet.absoluteFillObject },
  categoryGradient: { ...StyleSheet.absoluteFillObject },
  categoryTextRow: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  categoryTitle: { color: theme.colors.bg, fontWeight: '700', fontSize: 15 },
  categoryListings: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  aboutImageBlock: { marginBottom: theme.spacing.xxl + theme.spacing.lg, marginTop: theme.spacing.sm },
  aboutImage: { width: '100%', aspectRatio: 1.2, borderRadius: theme.radius.md },
  ownersCard: {
    position: 'absolute',
    bottom: -theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarRow: { flexDirection: 'row' },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
  avatarOverlap: { marginLeft: -8 },
  ownersCount: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  ownersQuote: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  aboutIntro: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.lg },
  aboutHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    lineHeight: 36,
    marginBottom: theme.spacing.lg,
  },
  aboutBody: { fontSize: 13, color: theme.colors.muted, marginBottom: theme.spacing.xl, lineHeight: 20 },
  statsBackground: { ...StyleSheet.absoluteFillObject, opacity: 0.08 },
  statsOverlay: { padding: theme.spacing.lg },
  statsSubtitle: { fontSize: 12, color: theme.colors.muted, marginBottom: theme.spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
  statItem: { width: '42%' },
  statIndex: { fontSize: 10, color: theme.colors.muted, marginBottom: theme.spacing.xs },
  statValue: { fontSize: 28, fontWeight: '800', color: theme.colors.primary },
  statLabel: { fontSize: 10, color: theme.colors.muted, marginTop: 2, letterSpacing: 0.5 },
});
