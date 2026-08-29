import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, PanResponder, RefreshControl, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
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
  useNotificationsViewModel,
  useProjectsViewModel,
} from '@jayedaad/core';
import { refreshControlProps, theme } from '@jayedaad/ui-native';
import { useAuthGate } from '../auth/AuthGateContext';
import { ProjectFavoriteButton } from '../components/ListingContactActions';
import { PremiumPromoCard } from '../components/PremiumPromoCard';
import { PropertyCard } from '../components/PropertyCard';
import { DRAWER_WIDTH, SideDrawer } from '../components/SideDrawer';
import { SearchFilterSheet } from '../components/SearchFilterSheet';
import { CityPickerModal } from '../components/CityPickerModal';
import { DEFAULT_SEARCH_FILTERS, SearchFilterState } from '../lib/searchFilters';
import { getRecentlyViewed } from '../lib/recentlyViewedStorage';
import { getHomeCity, setHomeCity } from '../lib/homeCityStorage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { BottomTabParamList } from '../navigation/BottomTabNavigator';
// White/light variant, not hero-logo.webp's dark-green mark — that one was
// designed for a light background and read as near-invisible against this
// header's dark photo/gradient.
import heroLogoImage from '../../assets/images/logo.png';
// Real Figma card background — replaces the hand-approximated 3-blob radial
// gradient (propertyCategoryBlob1/2/3) previously used behind each "Browse
// by category" tile's icon, which didn't match the design closely enough.
import categoryCardBackground from '../../assets/images/Link.png';
import heroBannerImage from '../../assets/images/home-banner.webp';
import lahoreImage from '../../assets/images/lahore.webp';
import karachiImage from '../../assets/images/karachi.webp';
import islamabadImage from '../../assets/images/islamabad.webp';
import dhaImage from '../../assets/images/DHA.webp';
import bahriaImage from '../../assets/images/bahria.webp';
import gulbergImage from '../../assets/images/gulberg.webp';

type Purpose = 'Buy' | 'Rent';
const PURPOSE_TABS: { value: Purpose; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'Buy', icon: 'home' },
  { value: 'Rent', icon: 'key' },
];

type Category = { id: string; title: string; image: number; isArea?: boolean };

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

export const HomeScreen = memo(function HomeScreen() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();

  // Shared with SideDrawer (see its own prop comment) so both the edge-swipe
  // gesture below and the normal tap-to-open/close tween drive the exact
  // same value, instead of the drawer only snapping into its own separate
  // animation once the finger lifts — that mismatch is what made a swipe
  // feel like it took two motions instead of one continuous drag-to-open.
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  // True for the duration of an in-progress drag — guards the tap-open/close
  // effect below from also firing (and fighting the live gesture) for the
  // same `drawerVisible` flip that the gesture handlers themselves cause.
  const isDraggingDrawer = useRef(false);

  function animateDrawerTo(open: boolean, velocity = 0) {
    Animated.spring(drawerTranslateX, {
      toValue: open ? 0 : -DRAWER_WIDTH,
      velocity,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }

  // Tap-to-open (hamburger icon) / tap-backdrop / tap-a-nav-row-to-close —
  // anything that flips `drawerVisible` without going through the gesture
  // handlers below. Skipped mid-drag (see isDraggingDrawer) since those
  // handlers already drive drawerTranslateX themselves in that case.
  useEffect(() => {
    if (isDraggingDrawer.current) return;
    animateDrawerTo(drawerVisible);
  }, [drawerVisible]);

  // Swipe-from-left-edge to open the drawer, same gesture users expect from
  // SideDrawer's hamburger icon. Built on RN core's PanResponder rather than
  // react-native-gesture-handler — SideDrawer.tsx already deliberately
  // avoids that dependency (see its own comment), so this stays consistent.
  // Capture-phase + a left-edge start + mostly-horizontal movement means it
  // only steals the gesture from the ScrollView for this specific swipe,
  // not normal vertical scrolling.
  //
  // Previously this only decided open-or-not on release, with no visual
  // feedback at all during the drag itself (the drawer would just snap into
  // its own 220ms tween afterward) — this now moves drawerTranslateX live
  // with the finger via onPanResponderMove, so opening genuinely tracks a
  // single continuous swipe instead of "drag, then wait, then it animates".
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        evt.nativeEvent.pageX < 24 && gestureState.dx > 12 && Math.abs(gestureState.dy) < 20,
      onPanResponderGrant: () => {
        isDraggingDrawer.current = true;
        setDrawerVisible(true);
      },
      onPanResponderMove: (_evt, gestureState) => {
        const next = Math.min(0, Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + gestureState.dx));
        drawerTranslateX.setValue(next);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        isDraggingDrawer.current = false;
        const shouldOpen = gestureState.dx > DRAWER_WIDTH / 3 || gestureState.vx > 0.5;
        if (shouldOpen) {
          // `drawerVisible` is already true (set in onPanResponderGrant), so
          // the tap-open effect above won't re-fire for this — finish the
          // animation here, carrying the release velocity into the spring.
          animateDrawerTo(true, gestureState.vx);
        } else {
          // Flips `drawerVisible` false, which the effect above picks up
          // (isDraggingDrawer is already false by now) to animate the close
          // — kept there rather than duplicated here so there's exactly one
          // place driving the close tween.
          setDrawerVisible(false);
        }
      },
      onPanResponderTerminate: () => {
        isDraggingDrawer.current = false;
        setDrawerVisible(false);
      },
    }),
  ).current;

  const {
    listings: featuredListings,
    isLoading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
    isRefetching: isRefetchingFeatured,
  } = useListingSearchViewModel({
    sortBy: 'newest',
    pageSize: 4,
  });

  const {
    projects: newProjects,
    error: projectsError,
    refetch: refetchProjects,
    isRefetching: isRefetchingProjects,
  } = useProjectsViewModel({ sortBy: 'newest', pageSize: 4 });
  const isRefetchingHome = isRefetchingFeatured || isRefetchingProjects;

  const { posts: blogPosts, isLoading: blogLoading } = useBlogViewModel({ limit: 3 });

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
    <SafeAreaView style={styles.root} edges={['left', 'right']} {...panResponder.panHandlers}>
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} translateX={drawerTranslateX} />
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingHome}
            onRefresh={() => {
              refetchFeatured();
              refetchProjects();
            }}
            {...refreshControlProps()}
          />
        }
      >
        <HomeHeader onMenuPress={() => setDrawerVisible(true)} />

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
            ) : featuredError ? (
              <Text style={styles.errorText}>Couldn't load listings — pull to refresh.</Text>
            ) : featuredListings.length === 0 ? (
              <Text style={styles.mutedText}>No listings yet.</Text>
            ) : (
              featuredListings.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
                />
              ))
            )}
          </View>
        </View>

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

          {projectsError ? (
            <Text style={styles.errorText}>Couldn't load projects — pull to refresh.</Text>
          ) : (
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
          )}
        </View>

        {/* This wrapper now centrally aligns the explicitly sized PremiumPromoCard */}
        <View style={styles.premiumCardWrap}>
          <PremiumPromoCard onPress={() => navigation.navigate('Plan')} />
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

function HomeHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & BottomTabParamList>>();
  const { user } = useAuthViewModel();
  const { requireAuth } = useAuthGate();
  const [purpose, setPurpose] = useState<Purpose>('Buy');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [city, setCity] = useState('Lahore');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  useEffect(() => {
    getHomeCity().then((stored) => {
      if (stored) setCity(stored);
    });
  }, []);

  function handleSelectCity(next: string) {
    setCity(next);
    setCityPickerVisible(false);
    setHomeCity(next);
  }

  const { unreadCount } = useNotificationsViewModel();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined);
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
              <Pressable
                style={styles.headerIconButton}
                hitSlop={8}
                onPress={() => requireAuth(() => navigation.navigate('Notifications'))}
              >
                <Ionicons name="notifications-outline" size={18} color={theme.colors.bg} />
                {unreadCount > 0 && <View style={styles.headerNotificationDot} />}
              </Pressable>
            </View>
          </View>

          <Text style={styles.greeting}>Assalam-o-Alaikum 👋</Text>
          <Text style={styles.headline}>{firstName ? `${firstName}, find your address` : 'Find your address'}</Text>
          <Pressable style={styles.headerLocationRow} onPress={() => setCityPickerVisible(true)} hitSlop={8}>
            <Ionicons name="location" size={14} color={theme.colors.bg} />
            <Text style={styles.headerLocationText}>{city}</Text>
            <Ionicons name="chevron-down" size={12} color={theme.colors.bg} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBarFloatWrap}>
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

      <View style={styles.purposeRowWrap}>
        <View style={styles.searchBar}>
          <Pressable style={styles.searchBarTextArea} onPress={() => setFilterSheetVisible(true)}>
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

      <SearchFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        value={{ ...DEFAULT_SEARCH_FILTERS, ...purposeToFilters(purpose) }}
        onApply={(applied) => navigation.navigate('BuyerSearch', { initialFilters: applied })}
      />

      <CityPickerModal visible={cityPickerVisible} onClose={() => setCityPickerVisible(false)} onSelect={handleSelectCity} />
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

      <ProjectFavoriteButton project={project} size={15} style={styles.projectFavoriteButton} />

      <View style={styles.projectTextBlock}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectDeveloper}>{project.developer.name}</Text>
        {price && <Text style={styles.projectPrice}>{price}</Text>}
      </View>
    </Pressable>
  );
}

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
      {/* Fixed-height header zone, not a percentage-height image absolutely
          filling propertyCategoryCard directly — that card has no explicit
          height of its own (it's sized by its content/padding), and RN/Yoga
          can't resolve a percentage height against an auto-height parent,
          so the image ended up stretching to cover the whole card again
          instead of just an accent band behind the icon. */}
      <View style={styles.propertyCategoryIconArea}>
        <Image source={categoryCardBackground} style={styles.propertyCategoryBackground} contentFit="cover" />
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
    <Pressable style={styles.categoryCardShadow} onPress={onPress}>
      <View style={styles.categoryCard}>
        <Image source={category.image} style={styles.categoryImage} contentFit="cover" transition={150} />
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.85)']}
          style={styles.categoryGradient}
        />
        <View style={styles.categoryTextRow}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryListings}>{listingsCount.toLocaleString('en-PK')} listings</Text>
        </View>
      </View>
    </Pressable>
  );
}

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
  // Flat section wrapper — no background fill/border-radius/shadow of its
  // own (that read as a big boxed "outline" behind each section on the
  // home screen). Just spacing; the actual cards inside each section
  // (category tiles, property cards) keep their own background/shadow/
  // elevation untouched.
  sectionCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  // alignItems:'center' here would shrink PremiumPromoCard to its content's
  // intrinsic width instead of stretching full-width (RN's flex default is
  // 'stretch') — breaks both the full-bleed look every other section card
  // has and the card's own aspectRatio-based height, which needs a real
  // stretched width to compute against.
  // Figma frame is 331.58pt wide — on a ~375-390pt phone that implies real
  // side margins around the card (roughly 20-30pt each), not edge-to-edge
  // full-bleed. Stretched to the same width as the "New projects" section
  // above it, the card's text/button read as undersized and sparse
  // relative to all that green — same content, wrong proportions. This
  // margin brings the card back down near Figma's actual width so its
  // existing type scale fills it the way the design intends.
  // marginTop added so the gap above the card is a real, explicit value
  // instead of relying purely on the previous sectionCard's own
  // paddingBottom — and marginBottom bumped past that same value (lg over
  // md) to compensate for the card's own downward drop shadow
  // (shadowOffset height:4 + shadowRadius:10), which visually eats into
  // the gap below the card but not the gap above it. Without the bump, the
  // shadow's blur made the space to the next section read noticeably
  // tighter than the space above, even though the raw margins matched.
  premiumCardWrap: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statsCard: { overflow: 'hidden', padding: 0 },
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
  // logo.png is the white/light variant (~2.68:1, transparent background) —
  // was hero-logo.webp's dark-green wordmark, which read as near-invisible
  // against this header's dark photo/gradient. contentFit="contain" keeps
  // it undistorted regardless of the exact source ratio inside this box.
  headerLogo: { width: 136, height: 48 },
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
  errorText: { fontSize: 13, color: theme.colors.danger, textAlign: 'center', paddingVertical: theme.spacing.lg },
  projectList: { gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  projectCard: {
    width: 200,
    height: 190,
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
  projectFavoriteButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    width: 26,
    height: 26,
  },
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
    width: '31%',
    alignItems: 'center',
    borderRadius: 20,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
  },
  // Fixed height, not a percentage — propertyCategoryCard itself has no
  // explicit height (it's sized by its content/padding), and RN/Yoga can't
  // resolve a percentage height against an auto-height parent, so an image
  // meant to cover only this band kept stretching to fill the whole card
  // instead. Owns the top padding above the icon itself (moved off the
  // card) so this is the only place that spacing needs to change.
  // Clips its own corners directly (overflow:hidden + matching radius on
  // this View, not just relying on propertyCategoryCard's), because
  // expo-image doesn't reliably honor a per-corner borderTopLeftRadius /
  // borderTopRightRadius on the Image itself — without this the image
  // rendered as a plain square rectangle poking past the card's rounded
  // top corners, reading as the top of the card being flat/cut instead of
  // rounded like the bottom (which has no image over it, just the card's
  // own clip, and rounds correctly).
  propertyCategoryIconArea: {
    width: '100%',
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // Link.png's blob pattern is a decorative accent behind the icon, not a
  // texture across the whole tile — confined to propertyCategoryIconArea's
  // fixed height above, clipped by that View's own overflow:hidden, so the
  // title/count below still sit on a plain white background.
  propertyCategoryBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  propertyCategoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(13,99,75,0.3)',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // Figma: Plus Jakarta Sans, Bold, 10.03px, line-height 15, letter-spacing 0%, fill #034B37, centered.
  propertyCategoryTitle: { fontSize: 10, fontWeight: '700', lineHeight: 15, letterSpacing: 0, textAlign: 'center', color: '#034B37' },
  propertyCategoryCount: { fontSize: 11, color: theme.colors.muted, marginTop: -2 },
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
  categoryCardShadow: {
    width: 180,
    aspectRatio: 1.25,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 14,
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