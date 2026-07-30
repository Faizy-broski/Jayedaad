import { memo, useState } from 'react';
import { ScrollView, Text, View, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@jayedaad/ui-native';
import { SideDrawer } from '../components/SideDrawer';
import logoImage from '../../assets/images/jayedaad.webp';
import skyViewVillaImage from '../../assets/images/Sky View Villa.webp';
import skylinePenthouseImage from '../../assets/images/Skyline Penthouse.webp';
import gulbergResidenceImage from '../../assets/images/Container.webp';
import dhaTownhouseImage from '../../assets/images/Ocean Residence.webp';
import luxuryVillasImage from '../../assets/images/Luxury-villas.webp';
import apartmentsImage from '../../assets/images/appartments.webp';
import plotsImage from '../../assets/images/plots.webp';
import commercialImage from '../../assets/images/commercial.webp';
import bannerImage from '../../assets/images/bannner.webp';
import lahoreImage from '../../assets/images/lahore.webp';
import karachiImage from '../../assets/images/karachi.webp';
import islamabadImage from '../../assets/images/islamabad.webp';
import dhaImage from '../../assets/images/DHA.webp';
import bahriaImage from '../../assets/images/bahria.webp';
import gulbergImage from '../../assets/images/gulberg.webp';

type Purpose = 'Buy' | 'Rent' | 'Commercial';
const PURPOSES: Purpose[] = ['Buy', 'Rent', 'Commercial'];
const SKYLINE_HEIGHTS = [22, 36, 18, 46, 26, 40, 20, 50, 28, 34, 16, 42];

type PropertyKind = 'Homes' | 'Plots' | 'Commercial';
const PROPERTY_KINDS: { key: PropertyKind; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Homes', icon: 'home' },
  { key: 'Plots', icon: 'location' },
  { key: 'Commercial', icon: 'business' },
];

const FILTER_CHIPS = ['Popular', 'Type', 'Location', 'Area Size'];

const QUICK_FILTER_PAGES = [
  [
    { id: 'qf-5marla', title: '5 Marla', subtitle: 'Houses' },
    { id: 'qf-10marla', title: '10 Marla', subtitle: 'Houses' },
    { id: 'qf-3marla', title: '3 Marla', subtitle: 'Houses' },
    { id: 'qf-new', title: 'New', subtitle: 'Houses' },
    { id: 'qf-lowprice-homes', title: 'Low Price', subtitle: 'Homes' },
    { id: 'qf-lowprice-houses', title: 'Low Price', subtitle: 'Houses' },
  ],
  [
    { id: 'qf-small', title: 'Small', subtitle: 'Houses' },
    { id: 'qf-installment-houses', title: 'On Installments', subtitle: 'Houses' },
    { id: 'qf-1bed', title: '1 Bedroom', subtitle: 'Flats' },
    { id: 'qf-2bed', title: '2 Bedroom', subtitle: 'Flats' },
    { id: 'qf-3bed', title: '3 Bedroom', subtitle: 'Flats' },
    { id: 'qf-installment-flats', title: 'On Installments', subtitle: 'Flats' },
  ],
];

const TRUST_BADGES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'checkmark-circle', label: 'Verified Listings' },
  { icon: 'sparkles', label: 'AI Search' },
  { icon: 'people', label: 'Trusted Agents' },
  { icon: 'shield-checkmark', label: 'Secure Payments' },
  { icon: 'headset', label: '24/7 Support' },
];

type Property = {
  id: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  image: number;
};

const FEATURED_PROPERTIES: Property[] = [
  {
    id: 'sky-view-villa',
    title: 'Sky View Villa',
    price: 'PKR 8.9 Cr',
    location: 'Bani Gala, Islamabad',
    beds: 5,
    baths: 6,
    area: '1 Kanal',
    image: skyViewVillaImage,
  },
  {
    id: 'penthouse',
    title: 'Penthouse',
    price: 'PKR 12.4 Cr',
    location: 'Clifton, Karachi',
    beds: 4,
    baths: 4,
    area: '4,200 sqft',
    image: skylinePenthouseImage,
  },
  {
    id: 'gulberg-residence',
    title: 'Gulberg Residence',
    price: 'PKR 6.2 Cr',
    location: 'DHA Phase 8, Karachi',
    beds: 3,
    baths: 3,
    area: '2,800 sqft',
    image: gulbergResidenceImage,
  },
  {
    id: 'dha-townhouse',
    title: 'DHA Townhouse',
    price: 'PKR 4.5 Cr',
    location: 'Bahria Town, Lahore',
    beds: 4,
    baths: 4,
    area: '10 Marla',
    image: dhaTownhouseImage,
  },
];

type Category = { id: string; title: string; listings: string; image: number };

const CATEGORIES: Category[] = [
  { id: 'luxury-villas', title: 'Luxury Villas', listings: '3,240 listings', image: luxuryVillasImage },
  { id: 'apartments', title: 'Apartments', listings: '8,120 listings', image: apartmentsImage },
  { id: 'plots', title: 'Plots', listings: '12,400 listings', image: plotsImage },
  { id: 'commercial', title: 'Commercial', listings: '1,540 listings', image: commercialImage },
];

const CITIES: Category[] = [
  { id: 'lahore', title: 'Lahore', listings: '8,240 homes', image: lahoreImage },
  { id: 'karachi', title: 'Karachi', listings: '8,240 homes', image: karachiImage },
  { id: 'islamabad', title: 'Islamabad', listings: '8,240 homes', image: islamabadImage },
  { id: 'dha', title: 'DHA', listings: '8,240 homes', image: dhaImage },
  { id: 'bahria', title: 'Bahria', listings: '8,240 homes', image: bahriaImage },
  { id: 'gulberg', title: 'Gulberg', listings: '8,240 homes', image: gulbergImage },
];

type Stat = { id: string; index: string; value: string; label: string };

const STATS: Stat[] = [
  { id: 'customers', index: '/ 01', value: '50K+', label: 'HAPPY CUSTOMERS' },
  { id: 'listings', index: '/ 02', value: '150K+', label: 'VERIFIED LISTINGS' },
  { id: 'cities', index: '/ 03', value: '200+', label: 'CITIES & AREAS' },
  { id: 'trust', index: '/ 04', value: '99%', label: 'TRUST SCORE' },
];

// Compact colored header (search-first, no decorative hero photo) + trust
// badges + featured properties — restructured after the Zameen.com reference:
// mobile real-estate apps lead with search, not a hero image, so the header
// puts Buy/Rent/Commercial + the search bar immediately under the wordmark.
export const HomeScreen = memo(function HomeScreen() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <HomeHeader onMenuPress={() => setDrawerVisible(true)} />
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        <BrowsePropertiesCard />

        <View style={styles.sectionCard}>
          <View style={styles.trustRowInCard}>
            {TRUST_BADGES.map((badge) => (
              <View key={badge.label} style={styles.trustItem}>
                <View style={styles.trustIconCircle}>
                  <Ionicons name={badge.icon} size={18} color={theme.colors.primary} />
                </View>
                <Text style={styles.trustLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.eyebrow}>HANDPICKED</Text>
          <Text style={styles.sectionTitle}>Featured properties</Text>
          <Text style={styles.sectionSubtitle}>
            A curated selection of Pakistan's most desirable homes — verified, photographed, and ready to move in.
          </Text>

          <FlatList
            data={FEATURED_PROPERTIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.propertyList}
            renderItem={({ item }) => <PropertyCard property={item} />}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.eyebrow}>EXPLORE</Text>
          <Text style={styles.sectionTitle}>Browse by category</Text>
          <Text style={styles.sectionSubtitle}>From investment plots to seafront penthouses — find what fits your life.</Text>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.eyebrow}>EXPLORE</Text>
              <Text style={styles.sectionTitle}>Where we live</Text>
            </View>
            <Text style={styles.viewAllLink}>All 24 cities</Text>
          </View>
          <Text style={styles.sectionSubtitle}>From investment plots to seafront penthouses — find what fits your life.</Text>

          <View style={styles.categoryGrid}>
            {CITIES.map((city) => (
              <CategoryCard key={city.id} category={city} />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.aboutImageBlock}>
            <Image source={bannerImage} style={styles.aboutImage} contentFit="cover" transition={150} />
            <View style={styles.ownersCard}>
              <View style={styles.avatarRow}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.avatarCircle, i > 0 && styles.avatarOverlap]}>
                    <Ionicons name="person" size={12} color={theme.colors.bg} />
                  </View>
                ))}
              </View>
              <View>
                <Text style={styles.ownersCount}>50K+ happy owners</Text>
                <Text style={styles.ownersQuote}>"Jayedaad made our first home purchase feel effortless."</Text>
              </View>
            </View>
          </View>

          <Text style={styles.eyebrow}>ABOUT JAYEDAAD</Text>
          <Text style={styles.aboutIntro}>
            Pakistan's modern real estate platform built to simplify buying, selling, & investing. We combine verified
            listings, local expertise to help you make confident property decisions.
          </Text>
          <Text style={styles.aboutHeading}>JAYEDAAD{'\n'}HOUSING</Text>
          <Text style={styles.aboutBody}>
            At Jayedaad, every listing is carefully verified to ensure transparency, accuracy, and peace of mind.
            Whether you're searching for your first home, a luxury residence, or your next investment opportunity, we
            deliver a seamless experience backed by trust and innovation.
          </Text>
        </View>

        <View style={[styles.sectionCard, styles.statsCard]}>
          <Image source={bannerImage} style={styles.statsBackground} contentFit="cover" />
          <View style={styles.statsOverlay}>
            <Text style={styles.eyebrow}>BY THE NUMBERS</Text>
            <Text style={styles.statsSubtitle}>
              Trusted by thousands across Pakistan, we're redefining the way people discover, buy, sell, and invest
              in real estate.
            </Text>
            <View style={styles.statsGrid}>
              {STATS.map((stat) => (
                <View key={stat.id} style={styles.statItem}>
                  <Text style={styles.statIndex}>{stat.index}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

function HomeHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const insets = useSafeAreaInsets();
  const [purpose, setPurpose] = useState<Purpose>('Buy');

  return (
    <View style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}>
      <View style={styles.skylineRow} pointerEvents="none">
        {SKYLINE_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.skylineBar, { height: h }]} />
        ))}
      </View>

      <View style={styles.headerTopRow}>
        <Pressable style={styles.headerIconButton} onPress={onMenuPress} hitSlop={8}>
          <Ionicons name="menu" size={20} color={theme.colors.bg} />
        </Pressable>
        <View style={styles.headerLogoBadge}>
          <Image source={logoImage} style={styles.headerLogo} contentFit="contain" />
        </View>
        <Pressable style={styles.headerIconButton}>
          <Ionicons name="notifications-outline" size={18} color={theme.colors.bg} />
        </Pressable>
      </View>

      <View style={styles.purposeRow}>
        {PURPOSES.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPurpose(p)}
            style={[styles.purposeTab, p === purpose && styles.purposeTabActive]}
          >
            <Text style={[styles.purposeText, p === purpose && styles.purposeTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.searchBar}>
        <Ionicons name="search" size={16} color={theme.colors.muted} />
        <Text style={styles.searchPlaceholder}>Search for {purpose === 'Rent' ? 'Rentals' : 'Flats'}</Text>
        <View style={styles.searchDivider} />
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>Lahore</Text>
          <View style={styles.locationArrow}>
            <Ionicons name="arrow-forward" size={12} color={theme.colors.bg} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function BrowsePropertiesCard() {
  const [kind, setKind] = useState<PropertyKind>('Homes');
  const [activeChip, setActiveChip] = useState('Popular');
  const [pageWidth, setPageWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.browseTitle}>Browse Properties</Text>

      <View style={styles.kindTabRow}>
        {PROPERTY_KINDS.map(({ key, icon }) => (
          <Pressable key={key} onPress={() => setKind(key)} style={styles.kindTab}>
            <Ionicons name={icon} size={16} color={kind === key ? theme.colors.primary : theme.colors.muted} />
            <Text style={[styles.kindTabText, kind === key && styles.kindTabTextActive]}>{key}</Text>
            {kind === key && <View style={styles.kindTabUnderline} />}
          </Pressable>
        ))}
      </View>
      <View style={styles.kindTabDivider} />

      <View style={styles.filterChipRow}>
        {FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => setActiveChip(chip)}
            style={[styles.filterChip, activeChip === chip && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeChip === chip && styles.filterChipTextActive]}>{chip}</Text>
          </Pressable>
        ))}
      </View>

      <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
        {pageWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActivePage(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
            }}
          >
            {QUICK_FILTER_PAGES.map((page, pageIndex) => (
              <View key={pageIndex} style={[styles.quickFilterGrid, { width: pageWidth }]}>
                {page.map((qf) => (
                  <Pressable key={qf.id} style={styles.quickFilterCard}>
                    <Text style={styles.quickFilterTitle}>{qf.title}</Text>
                    <Text style={styles.quickFilterSubtitle}>{qf.subtitle}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.paginationRow}>
        {QUICK_FILTER_PAGES.map((_, i) => (
          <View key={i} style={[styles.paginationDot, i === activePage && styles.paginationDotActive]} />
        ))}
      </View>
    </View>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <View style={styles.propertyCard}>
      <View>
        <Image source={property.image} style={styles.propertyImage} contentFit="cover" transition={150} />
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
        <Pressable style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={16} color={theme.colors.text} />
        </Pressable>
        <View style={styles.forSaleTag}>
          <Text style={styles.forSaleText}>For Sale</Text>
        </View>
      </View>

      <View style={styles.propertyBody}>
        <View style={styles.propertyTitleRow}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.propertyPrice}>{property.price}</Text>
        </View>
        <View style={styles.propertyLocationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.propertyLocation}>{property.location}</Text>
        </View>
        <View style={styles.propertyStatsRow}>
          <View style={styles.propertyStat}>
            <Ionicons name="bed-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.propertyStatText}>{property.beds}</Text>
          </View>
          <View style={styles.propertyStat}>
            <Ionicons name="water-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.propertyStatText}>{property.baths}</Text>
          </View>
          <View style={styles.propertyStat}>
            <Ionicons name="resize-outline" size={12} color={theme.colors.muted} />
            <Text style={styles.propertyStatText}>{property.area}</Text>
          </View>
        </View>
        <Text style={styles.viewDetails}>View details →</Text>
      </View>
    </View>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Pressable style={styles.categoryCard}>
      <Image source={category.image} style={styles.categoryImage} contentFit="cover" transition={150} />
      <LinearGradient
        colors={['transparent', 'rgba(15,23,42,0.85)']}
        style={styles.categoryGradient}
      />
      <View style={styles.categoryTextRow}>
        <View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryListings}>{category.listings}</Text>
        </View>
        <Ionicons name="arrow-up-outline" size={16} color={theme.colors.bg} style={styles.categoryArrowIcon} />
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
  browseTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },
  kindTabRow: { flexDirection: 'row', gap: theme.spacing.lg },
  kindTab: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingBottom: theme.spacing.sm },
  kindTabText: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  kindTabTextActive: { color: theme.colors.primary },
  kindTabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
  },
  kindTabDivider: { height: 1, backgroundColor: theme.colors.border, marginBottom: theme.spacing.md },
  filterChipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    backgroundColor: theme.colors.bg,
  },
  filterChipActive: { backgroundColor: theme.colors.secondaryBg },
  filterChipText: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  filterChipTextActive: { color: theme.colors.primary },
  quickFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  quickFilterCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  quickFilterTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  quickFilterSubtitle: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  paginationDotActive: { backgroundColor: theme.colors.primary },
  header: {
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 72,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  skylineRow: {
    position: 'absolute',
    left: -theme.spacing.lg,
    right: -theme.spacing.lg,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    opacity: 0.16,
  },
  skylineBar: { width: 18, backgroundColor: theme.colors.bg, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerLogoBadge: {
    backgroundColor: theme.colors.bg,
    borderRadius: 10,
    padding: 4,
  },
  headerLogo: { width: 40, height: 40 },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purposeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  purposeTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  purposeTabActive: { backgroundColor: theme.colors.bg },
  purposeText: { color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  purposeTextActive: { color: theme.colors.primary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 30,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  searchPlaceholder: { flex: 1, color: theme.colors.muted, fontSize: 14 },
  searchDivider: { width: 1, height: 22, backgroundColor: theme.colors.border },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  locationText: { fontWeight: '600', color: theme.colors.text, fontSize: 14 },
  locationArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustRowInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: { alignItems: 'center', flex: 1, gap: theme.spacing.xs },
  trustIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: { fontSize: 10, color: theme.colors.muted, textAlign: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionHeaderText: { flexShrink: 1 },
  viewAllLink: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, marginBottom: theme.spacing.xs },
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
  propertyList: { gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  propertyCard: {
    width: 220,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg,
  },
  propertyImage: { width: '100%', height: 140 },
  verifiedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 10, fontWeight: '600', color: theme.colors.primary },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forSaleTag: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  forSaleText: { fontSize: 10, fontWeight: '600', color: theme.colors.bg },
  propertyBody: { padding: theme.spacing.md, gap: theme.spacing.xs },
  propertyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propertyTitle: { fontWeight: '700', color: theme.colors.text, flexShrink: 1 },
  propertyPrice: { fontWeight: '700', color: theme.colors.primary, fontSize: 12 },
  propertyLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  propertyLocation: { fontSize: 11, color: theme.colors.muted },
  propertyStatsRow: { flexDirection: 'row', gap: theme.spacing.md },
  propertyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  propertyStatText: { fontSize: 11, color: theme.colors.muted },
  viewDetails: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, marginTop: theme.spacing.xs },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 0.78,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  categoryImage: { ...StyleSheet.absoluteFillObject },
  categoryGradient: { ...StyleSheet.absoluteFillObject },
  categoryTextRow: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
  },
  categoryTitle: { color: theme.colors.bg, fontWeight: '700', fontSize: 15 },
  categoryListings: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  categoryArrowIcon: { transform: [{ rotate: '45deg' }] },
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
