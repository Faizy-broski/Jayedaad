import { useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  ListingPurpose,
  ListingStatus,
  MyListingsFilters,
  formatPrice,
  useMyListingsViewModel,
  usePreferencesViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, PickerField, Tabs, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const PURPOSE_OPTIONS: { id: ListingPurpose | ''; label: string }[] = [
  { id: '', label: 'Any Purpose' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rent', label: 'For Rent' },
];

function formatListingCode(listingNumber: number): string {
  return `JYD-${String(listingNumber).padStart(5, '0')}`;
}

type TopTab = 'drafts' | 'uploaded';

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'drafts', label: 'Drafts' },
  { id: 'uploaded', label: 'Uploaded' },
];

const STATUS_TABS: { id: ListingStatus; label: string }[] = [
  { id: 'verified', label: 'Active' },
  { id: 'pending_verification', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
  { id: 'deleted', label: 'Deleted' },
  { id: 'inactive', label: 'Inactive' },
];

const DESTRUCTIVE_COLOR = theme.colors.danger;

export function MyPropertiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MyProperties'>>();
  const [topTab, setTopTab] = useState<TopTab>(route.params?.initialTab ?? 'uploaded');

  return (
    <View style={styles.root}>
      {/* Clean Header Area */}
      <View style={styles.headerRow}>
        <Tabs tabs={TOP_TABS} activeId={topTab} onChange={(id) => setTopTab(id as TopTab)} />
        <Text style={styles.selectLink}>Select</Text>
      </View>

      {topTab === 'uploaded' ? (
        <UploadedTab onAddProperty={() => navigation.navigate('PostListing')} />
      ) : (
        <DraftsTab onAddProperty={() => navigation.navigate('PostListing')} />
      )}
    </View>
  );
}

function UploadedTab({ onAddProperty }: { onAddProperty: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { propertyTypes } = useTaxonomyViewModel();
  const [status, setStatus] = useState<ListingStatus>('verified');

  const [listingNumber, setListingNumberInput] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [propertyTypeLabel, setPropertyTypeLabel] = useState('');
  const [purposeLabel, setPurposeLabel] = useState('');
  const [applied, setApplied] = useState({
    listingNumber: '',
    categorySlug: '',
    propertyTypeSlug: '',
    purpose: '' as ListingPurpose | '',
  });

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const typesInSelectedCategory = categoryLabel
    ? propertyTypes.filter((t) => t.category?.label === categoryLabel)
    : propertyTypes;

  const filters: MyListingsFilters = {
    status: applied.listingNumber ? undefined : status,
    page: 1,
    pageSize: 20,
    listingNumber: applied.listingNumber ? Number(applied.listingNumber.replace(/\D/g, '')) : undefined,
    propertyTypeCategory: applied.categorySlug || undefined,
    propertyTypeSlug: applied.propertyTypeSlug || undefined,
    purpose: applied.purpose || undefined,
  };

  const { listings, isLoading, remove } = useMyListingsViewModel(filters);
  const { preferences } = usePreferencesViewModel();
  const { showToast } = useToast();
  const activeLabel = STATUS_TABS.find((s) => s.id === status)?.label ?? '';

  function handleSearch() {
    setApplied({
      listingNumber,
      categorySlug: categories.find((c) => c.label === categoryLabel)?.slug ?? '',
      propertyTypeSlug: propertyTypes.find((t) => t.label === propertyTypeLabel)?.slug ?? '',
      purpose: (PURPOSE_OPTIONS.find((p) => p.label === purposeLabel)?.id ?? '') as ListingPurpose | '',
    });
  }

  function handleClearFilters() {
    setListingNumberInput('');
    setCategoryLabel('');
    setPropertyTypeLabel('');
    setPurposeLabel('');
    setApplied({ listingNumber: '', categorySlug: '', propertyTypeSlug: '', purpose: '' });
  }

  async function handleCopyId(listingNumber: number) {
    await Clipboard.setStringAsync(formatListingCode(listingNumber));
    showToast('Listing ID copied.');
  }

  function handleDelete(listingId: string, title: string) {
    Alert.alert('Delete Listing', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(listingId, {
            onSuccess: () => showToast('Listing deleted successfully.'),
            onError: () => showToast('Something went wrong — please try again.', 'error'),
          }),
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      
      {/* Modern Seamless Filter Bar */}
      <View style={styles.filterBar}>
        <TextInput
          value={listingNumber}
          onChangeText={setListingNumberInput}
          placeholder="Enter Listing ID (e.g. JYD-00001)"
          style={styles.flatInput}
        />
        <View style={styles.filterRow2}>
          <View style={styles.pickerWrapper}>
            <PickerField
              value={categoryLabel}
              options={categories.map((c) => c.label)}
              placeholder="Category"
              title="Category"
              onChange={(label) => {
                setCategoryLabel(label);
                setPropertyTypeLabel('');
              }}
            />
          </View>
          <View style={styles.pickerWrapper}>
            <PickerField
              value={propertyTypeLabel}
              options={typesInSelectedCategory.map((t) => t.label)}
              placeholder="Property Type"
              title="Property Type"
              onChange={setPropertyTypeLabel}
            />
          </View>
        </View>
        <View style={styles.filterRow2}>
          <View style={styles.pickerWrapper}>
            <PickerField
              value={purposeLabel}
              options={PURPOSE_OPTIONS.map((p) => p.label)}
              placeholder="Purpose"
              title="Purpose"
              onChange={setPurposeLabel}
            />
          </View>
        </View>
        <View style={styles.filterActionsRow}>
          <Pressable onPress={handleClearFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersLink}>Clear filters</Text>
          </Pressable>
          <View style={styles.searchButtonWrapper}>
            <Button label="Search" onPress={handleSearch} />
          </View>
        </View>
      </View>

      {/* Smooth Pill Navigation */}
      <View style={styles.pillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pillRow}>
          {STATUS_TABS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setStatus(s.id)}
              style={[styles.pill, s.id === status && styles.pillActive]}
            >
              <Text style={[styles.pillText, s.id === status && styles.pillTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Fetching properties…</Text>
        </View>
      ) : listings.length === 0 ? (
        <EmptyState
          heading={`No ${activeLabel} Properties`}
          message={`You don't have any ${activeLabel.toLowerCase()} properties at the moment. Post a new property to get started.`}
          onAddProperty={onAddProperty}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {listings.map((listing) => (
            <View key={listing.id} style={styles.card}>
              
              <View style={styles.cardHeader}>
                <Pressable style={styles.idBadge} onPress={() => handleCopyId(listing.listingNumber)}>
                  <Ionicons name="copy-outline" size={12} color={theme.colors.muted} />
                  <Text style={styles.idBadgeText}>{formatListingCode(listing.listingNumber)}</Text>
                </Pressable>
                <Text style={styles.priceText}>
                  {formatPrice(Number(listing.price), preferences?.preferredCurrency)}
                </Text>
              </View>

              <Text style={styles.rowTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {listing.area}, {listing.city}
              </Text>
              
              <View style={styles.cardDivider} />
              
              <View style={styles.rowActions}>
                <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}>
                  <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.actionTextPrimary}>View</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
                >
                  <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.actionTextPrimary}>Edit details</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  disabled={remove.isPending}
                  onPress={() => handleDelete(listing.id, listing.title)}
                >
                  <Ionicons name="trash-outline" size={16} color={DESTRUCTIVE_COLOR} />
                  <Text style={styles.actionTextDestructive}>Delete</Text>
                </Pressable>
              </View>

            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DraftsTab({ onAddProperty }: { onAddProperty: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listings, isLoading, remove, submitForVerification } = useMyListingsViewModel({
    status: 'draft',
    page: 1,
    pageSize: 20,
  });
  const { preferences } = usePreferencesViewModel();
  const { showToast } = useToast();

  function handleDelete(listingId: string, title: string) {
    Alert.alert('Delete Draft', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(listingId, {
            onSuccess: () => showToast('Draft deleted.'),
            onError: () => showToast('Something went wrong — please try again.', 'error'),
          }),
      },
    ]);
  }

  function handleSubmit(listingId: string) {
    submitForVerification.mutate(listingId, {
      onSuccess: () => showToast('Submitted for verification.'),
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.muted}>Fetching drafts…</Text>
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        heading="No Saved Drafts"
        message="You haven't saved any property drafts yet. Start a new listing to see it here."
        onAddProperty={onAddProperty}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {listings.map((listing) => (
        <View key={listing.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Pressable style={styles.idBadge}>
              <Ionicons name="document-text-outline" size={12} color={theme.colors.muted} />
              <Text style={styles.idBadgeText}>DRAFT</Text>
            </Pressable>
            <Text style={styles.priceText}>{formatPrice(Number(listing.price), preferences?.preferredCurrency)}</Text>
          </View>

          <Text style={styles.rowTitle} numberOfLines={1}>{listing.title || 'Untitled draft'}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {listing.area}, {listing.city}
          </Text>

          <View style={styles.cardDivider} />

          <View style={styles.rowActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary}>Edit details</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              disabled={submitForVerification.isPending}
              onPress={() => handleSubmit(listing.id)}
            >
              <Ionicons name="send-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary}>Submit</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              disabled={remove.isPending}
              onPress={() => handleDelete(listing.id, listing.title)}
            >
              <Ionicons name="trash-outline" size={16} color={DESTRUCTIVE_COLOR} />
              <Text style={styles.actionTextDestructive}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyState({ heading, message, onAddProperty }: { heading: string; message: string; onAddProperty: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="document-text-outline" size={38} color={theme.colors.mutedLight} />
      </View>
      <Text style={styles.emptyHeading}>{heading}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <View style={styles.emptyButtonWrapper}>
        <Button label="Post an Ad" onPress={onAddProperty} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: theme.colors.bg // Clean edge-to-edge white
  },
  flex: { 
    flex: 1 
  },
  
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  selectLink: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: theme.colors.mutedLight 
  },
  
  // Modern Filter Bar
  filterBar: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    gap: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.surfaceAlt 
  },
  flatInput: { 
    height: 52,
    backgroundColor: theme.colors.surface, 
    borderRadius: 12, 
    borderWidth: 0, // Removes harsh borders
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  filterRow2: { 
    flexDirection: 'row', 
    gap: 12 
  },
  pickerWrapper: { 
    flex: 1,
    height: 52,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterActionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 4 
  },
  clearFiltersButton: {
    paddingVertical: 8,
  },
  clearFiltersLink: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: theme.colors.muted // Softer gray instead of harsh red
  },
  searchButtonWrapper: { 
    width: 120 
  },
  
  // Smooth Pills
  pillContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  pillScroll: { 
    flexGrow: 0 
  },
  pillRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pill: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActive: { 
    backgroundColor: theme.colors.primary, 
  },
  pillText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.colors.muted 
  },
  pillTextActive: { 
    color: theme.colors.bg 
  },
  
  // List & Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { 
    fontSize: 14, 
    color: theme.colors.mutedLight,
    fontWeight: '500',
  },
  list: { 
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16, 
  },
  
  // Premium Property Card
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  idBadgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: theme.colors.muted, 
    letterSpacing: 0.5 
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  rowTitle: { 
    fontSize: 15,
    fontWeight: '700', 
    color: theme.colors.text,
    marginBottom: 4,
  },
  rowSubtitle: { 
    fontSize: 13, 
    color: theme.colors.muted,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.surfaceAlt,
    marginVertical: 16,
  },
  rowActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
    gap: 6, 
  },
  actionTextPrimary: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.colors.primary 
  },
  actionTextDestructive: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: DESTRUCTIVE_COLOR 
  },
  
  // Empty State Hero
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
    width: '100%' 
  },
});