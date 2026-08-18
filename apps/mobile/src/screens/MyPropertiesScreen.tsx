import { useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
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
import { BackButton, Button, PickerField, refreshControlProps, Tabs, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BoostMenu } from '../components/BoostMenu';

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

  const addProperty = () => navigation.navigate('PostListing');

  return (
    <View style={styles.root}>
      {/* Clean Header Area */}
      <View style={styles.headerRow}>
        <Tabs tabs={TOP_TABS} activeId={topTab} onChange={(id) => setTopTab(id as TopTab)} />
        {/* Previously the only way to add a property was EmptyState's "Post
            an Ad" button, which only renders once a tab/filter combo has
            zero results — anyone with existing listings had no way to add
            another one from this screen at all. That was a bare unlabeled
            "+" circle next to a "Select" label that did nothing — replaced
            with one real, legible button. */}
        <Pressable style={styles.addButton} onPress={addProperty}>
          <Ionicons name="add" size={16} color={theme.colors.bg} />
          <Text style={styles.addButtonText}>Add Property</Text>
        </Pressable>
      </View>

      {topTab === 'uploaded' ? <UploadedTab onAddProperty={addProperty} /> : <DraftsTab onAddProperty={addProperty} />}
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
  // Category/Property Type/Purpose used to sit permanently visible as 3
  // stacked dropdown boxes between the search bar and the results — same
  // "search bar + filter icon opening a sheet" pattern BuyerSearchScreen/
  // AllPropertiesScreen already use, instead of a bespoke layout just for
  // this screen.
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
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

  const {
    listings,
    isLoading,
    isError,
    remove,
    boost,
    renew,
    refresh,
    postStory,
    refetchListings,
    isRefetchingListings,
  } = useMyListingsViewModel(filters);
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
    setFilterSheetVisible(false);
  }

  const hasActiveFilters = !!(applied.categorySlug || applied.propertyTypeSlug || applied.purpose);

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
    // Filters + status pills used to sit outside this ScrollView, permanently
    // pinned above the list — that ate a fixed chunk of screen height on
    // every scroll and felt disjointed from the content they filter. They're
    // now part of the same scrollable content as the list itself, so the
    // whole screen scrolls as one smooth surface (and they still show up
    // above the loading/error/empty states, not just the populated list).
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetchingListings} onRefresh={() => refetchListings()} {...refreshControlProps()} />
      }
    >
      {/* Search bar + filter icon side by side — same pattern
          BuyerSearchScreen/AllPropertiesScreen already use, instead of
          Category/Property Type/Purpose sitting permanently visible as 3
          stacked dropdown boxes eating vertical space before any results
          are even in view. */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={17} color={theme.colors.mutedLight} style={styles.searchIcon} />
          <TextInput
            value={listingNumber}
            onChangeText={setListingNumberInput}
            placeholder="Enter Listing ID (e.g. JYD-00001)"
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.filterIconButton} onPress={() => setFilterSheetVisible(true)}>
          <Ionicons name="options-outline" size={20} color={theme.colors.bg} />
          {hasActiveFilters && <View style={styles.filterActiveDot} />}
        </Pressable>
      </View>

      <Modal
        visible={filterSheetVisible}
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <BackButton onPress={() => setFilterSheetVisible(false)} />
            <Text style={styles.sheetHeaderTitle}>Filters</Text>
            <View style={styles.sheetHeaderIconButton} />
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Category</Text>
              <PickerField
                value={categoryLabel}
                options={categories.map((c) => c.label)}
                placeholder="Any Category"
                title="Category"
                onChange={(label) => {
                  setCategoryLabel(label);
                  setPropertyTypeLabel('');
                }}
              />
            </View>
            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Property Type</Text>
              <PickerField
                value={propertyTypeLabel}
                options={typesInSelectedCategory.map((t) => t.label)}
                placeholder="Any Type"
                title="Property Type"
                onChange={setPropertyTypeLabel}
              />
            </View>
            <View style={styles.sheetField}>
              <Text style={styles.sheetLabel}>Purpose</Text>
              <PickerField
                value={purposeLabel}
                options={PURPOSE_OPTIONS.map((p) => p.label)}
                placeholder="Any Purpose"
                title="Purpose"
                onChange={setPurposeLabel}
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable onPress={handleClearFilters} style={styles.sheetResetButton} hitSlop={8}>
              <Text style={styles.sheetResetLink}>Clear filters</Text>
            </Pressable>
            <View style={styles.sheetApplyButton}>
              <Button label="Search" onPress={handleSearch} />
            </View>
          </View>
        </View>
      </Modal>

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
        <View style={styles.list}>
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

              {/* Was a horizontal ScrollView with showsHorizontalScrollIndicator={false}
                  — Delete (last in the row) needed an undiscoverable swipe to
                  even find, with zero visual hint anything was off-screen.
                  Wrapping instead of scrolling means every action is always
                  visible without hunting for it, even if the card grows a
                  line taller. */}
              <View style={styles.rowActions}>
                <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}>
                  <Ionicons name="eye-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.actionTextPrimary} numberOfLines={1}>View</Text>
                </Pressable>

                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
                >
                  <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
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
                    <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>Documents</Text>
                  </Pressable>
                )}

                {/* listing.status, not the `status` tab-filter state — the
                    Listing ID search clears the status filter server-side
                    (a match can be any status), so gating on the tab would
                    show Boost for a non-verified row whenever the default
                    'verified' tab is active during a search.
                    Was 4 separate buttons (Hot/Super Hot/Refresh/Story) —
                    on a verified listing that made this row 7-8 buttons
                    wide, and with showsHorizontalScrollIndicator={false}
                    there was no visible hint that Delete (the last button)
                    even existed off-screen to the right. One "Boost" menu
                    now covers all 4 credit actions. */}
                {listing.status === 'verified' && (
                  <BoostMenu
                    creditsAvailable={creditsAvailable}
                    isPending={boost.isPending || refresh.isPending || postStory.isPending}
                    onHot={() => handleBoost(listing.id, 'hot')}
                    onSuperHot={() => handleBoost(listing.id, 'super_hot')}
                    onRefresh={() => handleRefresh(listing.id)}
                    onStory={() => handlePostStory(listing.id)}
                    onBuyMore={() => navigation.navigate('Plan')}
                  />
                )}

                {listing.status === 'expired' && (
                  <Pressable style={styles.actionButton} disabled={renew.isPending} onPress={() => handleRenew(listing.id)}>
                    <Ionicons name="refresh-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.actionTextPrimary} numberOfLines={1}>Renew</Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.actionButton, styles.actionButtonDestructive]}
                  disabled={remove.isPending}
                  onPress={() => handleDelete(listing.id, listing.title)}
                >
                  <Ionicons name="trash-outline" size={14} color={DESTRUCTIVE_COLOR} />
                  <Text style={styles.actionTextDestructive} numberOfLines={1}>Delete</Text>
                </Pressable>
              </View>

            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function DraftsTab({ onAddProperty }: { onAddProperty: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    listings,
    isLoading,
    isError,
    remove,
    submitForVerification,
    refetchListings,
    isRefetchingListings,
  } = useMyListingsViewModel({
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
    <ScrollView
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetchingListings} onRefresh={() => refetchListings()} {...refreshControlProps()} />
      }
    >
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

          <View style={styles.rowActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate('PostListing', { editListingId: listing.id })}
            >
              <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary} numberOfLines={1}>Edit details</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              disabled={submitForVerification.isPending}
              onPress={() => handleSubmit(listing.id)}
            >
              <Ionicons name="send-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.actionTextPrimary} numberOfLines={1}>Submit</Text>
            </Pressable>

            {documentsRequired && (
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate('ListingDocuments', { listingId: listing.id })}
              >
                <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.actionTextPrimary} numberOfLines={1}>Documents</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionButton, styles.actionButtonDestructive]}
              disabled={remove.isPending}
              onPress={() => handleDelete(listing.id, listing.title)}
            >
              <Ionicons name="trash-outline" size={14} color={DESTRUCTIVE_COLOR} />
              <Text style={styles.actionTextDestructive} numberOfLines={1}>Delete</Text>
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

// BoostMenu moved to ../components/BoostMenu.tsx — shared with
// MyProjectsScreen.tsx, since both spend from the same agent_credits pool
// and the component itself has zero listing-specific logic.

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: theme.colors.bg // Clean edge-to-edge white
  },
  flex: {
    flex: 1
  },
  // flexGrow (not just the ScrollView's own flex:1) so loadingContainer/
  // empty's flex:1 centering below still works now that they're content
  // inside the scroll view rather than a sibling occupying the remaining
  // screen space directly.
  scrollContent: {
    flexGrow: 1,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.bg,
  },
  
  // Search bar + filter icon, side by side — same pattern as
  // BuyerSearchScreen.tsx's own searchRow/searchFilterIconButton.
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchInputWrap: { flex: 1, justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    height: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 16,
    paddingLeft: 40,
    marginBottom: 0,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Small dot on the filter button itself so an agent can tell a filter is
  // applied without having to reopen the sheet to check.
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: theme.colors.bg,
  },

  // Filter sheet — Category/Property Type/Purpose used to sit permanently
  // visible as 3 stacked dropdown boxes; same header/content/footer chrome
  // as AllPropertiesFilterSheet.tsx, scoped to just these 3 fields.
  sheetContainer: { flex: 1, backgroundColor: theme.colors.bg },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sheetHeaderIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sheetHeaderTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  sheetContent: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  sheetField: { gap: theme.spacing.sm },
  sheetLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  sheetResetButton: {
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sheetResetLink: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  sheetApplyButton: { flex: 1 },


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
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  // Were plain icon+text links with no button affordance at all (see
  // screenshot: "View", "Edit details" etc. read as bare inline text) —
  // real pill/chip buttons give each action a clear tappable boundary and
  // stop the row from reading as a wall of green text once it wraps to a
  // second line.
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionButtonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  actionTextPrimary: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.primary
  },
  actionTextDestructive: {
    fontSize: 12.5,
    fontWeight: '700',
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