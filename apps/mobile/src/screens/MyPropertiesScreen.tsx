import { useState } from 'react';
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  AgentCreditType,
  ListingDocumentType,
  ListingPurpose,
  ListingStatus,
  MyListingsFilters,
  listingsRepository,
  useAgentCreditsViewModel,
  useAgentProfileViewModel,
  useAuthViewModel,
  useFormattedPrice,
  useMyListingsViewModel,
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

// Same set the server enforces (REQUIRED_LISTING_DOCUMENT_TYPES in
// listings.repository.ts) — kept in sync manually, same convention as
// ListingDocumentsScreen.tsx's own DOCUMENT_TYPES array.
const REQUIRED_LISTING_DOCUMENT_TYPES: ListingDocumentType[] = ['ownership_proof', 'utility_bill'];

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

  const { listings, isLoading, isError, remove, boost, renew, refresh, postStory } = useMyListingsViewModel(filters);
  const { format: formatPrice } = useFormattedPrice();
  const { role } = useAuthViewModel();
  // Pre-flight balance so Hot/Super Hot/Refresh/Story buttons can show
  // "N left" and disable at 0, instead of only finding out via a server
  // error after tapping — server stays the actual source of truth (this is
  // purely an additive UI convenience, not a replacement for it).
  const { credits } = useAgentCreditsViewModel();
  const creditsAvailable = (type: AgentCreditType) => credits.find((c) => c.creditType === type)?.available ?? 0;
  // enabled: !!agentId inside the hook itself — a no-op fetch for non-agents.
  const { profile: agentProfile } = useAgentProfileViewModel();
  // Required for owners AND independent agents (no agency) — only an
  // agency-affiliated agent is exempt, mirrors the server's
  // getDocumentCompleteness exemption.
  const documentsRequired = role === 'agent' && !agentProfile?.agency;
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

  // Spends one of the agent's plan-granted Hot/Super Hot credits (topped up
  // on tier selection/renewal — see the Plan screen) to feature this
  // listing. The server is the source of truth on whether a credit is
  // actually available.
  function handleBoost(listingId: string, boostTier: 'hot' | 'super_hot') {
    boost.mutate(
      { listingId, input: { boostTier } },
      {
        onSuccess: () => showToast(`Listing boosted (${boostTier === 'hot' ? 'Hot' : 'Super Hot'}).`),
        onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
      },
    );
  }

  // Resets an expired listing back to 'verified' with a fresh expiry window
  // (PlanLifecycleService's cron sets status: 'expired' once a plan's
  // listingDurationDays lapses) — the Expired tab's "Renew" action.
  function handleRenew(listingId: string) {
    renew.mutate(listingId, {
      onSuccess: () => showToast('Listing renewed.'),
      onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
    });
  }

  // Spends one of the agent's plan-granted Refresh credits to bump this
  // listing's sort position within its current boost tier.
  function handleRefresh(listingId: string) {
    refresh.mutate(listingId, {
      onSuccess: () => showToast('Listing refreshed.'),
      onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
    });
  }

  // Spends one of the agent's plan-granted Story credits to feature this
  // listing for a fixed 24h window.
  function handlePostStory(listingId: string) {
    postStory.mutate(listingId, {
      onSuccess: () => showToast('Listing posted as a story.'),
      onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
    });
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
      ) : isError ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.error}>Couldn't load your properties — please try again.</Text>
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
                  {formatPrice(Number(listing.price))}
                </Text>
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.rowTitle} numberOfLines={1}>{listing.title}</Text>
                {listing.boostTier !== 'basic' && (
                  <View style={styles.boostBadge}>
                    <Ionicons name={listing.boostTier === 'super_hot' ? 'flame' : 'sparkles'} size={11} color="#B45309" />
                    <Text style={styles.boostBadgeText}>{listing.boostTier === 'super_hot' ? 'Super Hot' : 'Hot'}</Text>
                  </View>
                )}
                {listing.storyExpiresAt && new Date(listing.storyExpiresAt) > new Date() && (
                  <View style={styles.storyBadge}>
                    <Ionicons name="film-outline" size={11} color="#A21CAF" />
                    <Text style={styles.storyBadgeText}>Story</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {listing.area}, {listing.city}
              </Text>
              {listing.status === 'verified' && listing.expiresAt && (
                <Text style={styles.expiresText}>
                  Expires {new Date(listing.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </Text>
              )}

              <View style={styles.cardDivider} />
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowActions}>
                <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}>
                  <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.actionTextPrimary} numberOfLines={1}>View</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
                >
                  <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.actionTextPrimary} numberOfLines={1}>Edit details</Text>
                </Pressable>

                {/* Ownership proof/utility bill are required for owners and
                    independent agents (agency-affiliated agents are exempt)
                    — the only re-entry point back into
                    ListingDocumentsScreen after skipping it right after
                    creation. */}
                {documentsRequired && (
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('ListingDocuments', { listingId: listing.id })}
                  >
                    <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>Documents</Text>
                  </Pressable>
                )}

                {/* listing.status, not the `status` tab-filter state — the
                    Listing ID search clears the status filter server-side
                    (a match can be any status), so gating on the tab would
                    show Boost for a non-verified row whenever the default
                    'verified' tab is active during a search. */}
                {listing.status === 'verified' && (
                  <>
                    <Pressable
                      style={styles.actionButton}
                      disabled={boost.isPending || creditsAvailable('hot') <= 0}
                      onPress={() => handleBoost(listing.id, 'hot')}
                    >
                      <Ionicons name="sparkles-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionTextPrimary} numberOfLines={1}>Hot ({creditsAvailable('hot')})</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      disabled={boost.isPending || creditsAvailable('super_hot') <= 0}
                      onPress={() => handleBoost(listing.id, 'super_hot')}
                    >
                      <Ionicons name="flame-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionTextPrimary} numberOfLines={1}>Super Hot ({creditsAvailable('super_hot')})</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      disabled={refresh.isPending || creditsAvailable('refresh') <= 0}
                      onPress={() => handleRefresh(listing.id)}
                    >
                      <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionTextPrimary} numberOfLines={1}>Refresh ({creditsAvailable('refresh')})</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      disabled={postStory.isPending || creditsAvailable('story') <= 0}
                      onPress={() => handlePostStory(listing.id)}
                    >
                      <Ionicons name="film-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionTextPrimary} numberOfLines={1}>Story ({creditsAvailable('story')})</Text>
                    </Pressable>
                  </>
                )}

                {listing.status === 'expired' && (
                  <Pressable style={styles.actionButton} disabled={renew.isPending} onPress={() => handleRenew(listing.id)}>
                    <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>Renew</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.actionButton}
                  disabled={remove.isPending}
                  onPress={() => handleDelete(listing.id, listing.title)}
                >
                  <Ionicons name="trash-outline" size={16} color={DESTRUCTIVE_COLOR} />
                  <Text style={styles.actionTextDestructive} numberOfLines={1}>Delete</Text>
                </Pressable>
              </ScrollView>

            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DraftsTab({ onAddProperty }: { onAddProperty: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listings, isLoading, isError, remove, submitForVerification } = useMyListingsViewModel({
    status: 'draft',
    page: 1,
    pageSize: 20,
  });
  const { format: formatPrice } = useFormattedPrice();
  const { role } = useAuthViewModel();
  // enabled: !!agentId inside the hook itself — a no-op fetch for non-agents.
  const { profile: agentProfile } = useAgentProfileViewModel();
  // Required for owners AND independent agents (no agency) — only an
  // agency-affiliated agent is exempt, mirrors the server's
  // getDocumentCompleteness exemption.
  const documentsRequired = role === 'agent' && !agentProfile?.agency;
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

  // Route to the documents screen instead of submitting directly when
  // ownership proof/utility bill are incomplete — closes the bug where
  // finishing a draft from this tab skipped ownership-proof entirely (the
  // server now also hard-rejects this via assertDocumentsComplete, this is
  // just so the user lands on the right screen instead of a raw error).
  async function handleSubmit(listingId: string) {
    if (documentsRequired) {
      const docs = await listingsRepository.listDocuments(listingId);
      const uploadedTypes = new Set(docs.map((d) => d.documentType));
      const incomplete = REQUIRED_LISTING_DOCUMENT_TYPES.some((type) => !uploadedTypes.has(type));
      if (incomplete) {
        navigation.navigate('ListingDocuments', { listingId, submitOnComplete: true });
        return;
      }
    }
    submitForVerification.mutate(listingId, {
      onSuccess: () => showToast('Submitted for verification.'),
      onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
    });
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.muted}>Fetching drafts…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>Couldn't load your drafts — please try again.</Text>
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
            <Text style={styles.priceText}>{formatPrice(Number(listing.price))}</Text>
          </View>

          <Text style={styles.rowTitle} numberOfLines={1}>{listing.title || 'Untitled draft'}</Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {listing.area}, {listing.city}
          </Text>

          <View style={styles.cardDivider} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary} numberOfLines={1}>Edit details</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              disabled={submitForVerification.isPending}
              onPress={() => handleSubmit(listing.id)}
            >
              <Ionicons name="send-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary} numberOfLines={1}>Submit</Text>
            </Pressable>

            {documentsRequired && (
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('ListingDocuments', { listingId: listing.id })}
              >
                <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.actionTextPrimary} numberOfLines={1}>Documents</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.actionButton}
              disabled={remove.isPending}
              onPress={() => handleDelete(listing.id, listing.title)}
            >
              <Ionicons name="trash-outline" size={16} color={DESTRUCTIVE_COLOR} />
              <Text style={styles.actionTextDestructive} numberOfLines={1}>Delete</Text>
            </Pressable>
          </ScrollView>
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
  error: {
    fontSize: 14,
    color: theme.colors.danger,
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    flexShrink: 1,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  boostBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  storyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAE8FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  storyBadgeText: { fontSize: 11, fontWeight: '700', color: '#A21CAF' },
  rowSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  expiresText: { fontSize: 11, color: theme.colors.mutedLight, marginTop: 2 },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.surfaceAlt,
    marginVertical: 16,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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