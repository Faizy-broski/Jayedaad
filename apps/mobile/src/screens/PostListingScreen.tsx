import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, ScrollView, Text, View, Pressable, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  AreaUnit,
  COUNTRIES,
  CreateListingInput,
  FurnishingStatus,
  Listing,
  ListingDocumentType,
  ListingPurpose,
  PAKISTAN_CITIES,
  getMaxPhoneDigits,
  getRequiredMediaCategories,
  listingsRepository,
  useAgentProfileViewModel,
  useAuthViewModel,
  useListingSubmissionViewModel,
  useOwnerVerificationViewModel,
  useSubscriptionViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Accordion, BackButton, Button, CountryCodeField, PickerField, Stepper, TextInput, WizardFooter, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { AmenitySelectionMap } from './AddFeaturesScreen';
import { PlacesAutocompleteInput } from '../components/PlacesAutocompleteInput';

// Property-type category icon cards (Property step) — same category slugs
// (residential/plot/commercial) and icon choices HomeScreen.tsx already
// established for its Homes/Plots/Commercial browse cards (home/flag/
// business), just the outline variant to match the Figma reference's line
// icons.
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  residential: 'home-outline',
  plot: 'flag-outline',
  commercial: 'business-outline',
};

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES: FurnishingStatus[] = ['unfurnished', 'semi_furnished', 'furnished'];
const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'];
const REQUIRED_LISTING_DOCUMENT_TYPES: ListingDocumentType[] = ['ownership_proof', 'utility_bill'];

// Step wizard — same state-machine shape as apps/web's submit page
// (step/maxStepReached/canContinue), just a different step count/grouping
// to match this screen's Figma reference (which shows 6 tabs; Documents
// gets a 7th here since it's a real required step, not shown in that
// particular mock but not something that can be dropped).
const STEPS = [
  { key: 'property', label: 'Property' },
  { key: 'location', label: 'Location' },
  { key: 'details', label: 'Details' },
  { key: 'features', label: 'Features' },
  { key: 'media', label: 'Media' },
  { key: 'documents', label: 'Documents' },
  { key: 'contact', label: 'Contact' },
];

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  status: 'uploading' | 'done' | 'error';
  url?: string;
  // Airbnb-style room category — undefined for legacy/unfiled items.
  category?: string;
}

export function PostListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const route = useRoute<RouteProp<RootStackParamList, 'PostListing'>>();
  const editId = route.params?.editListingId;
  const { showToast } = useToast();
  const { role } = useAuthViewModel();
  // Real quota enforcement (services/api's ListingsRepository.create()) only
  // gates agent-submitted listings, not owner ones.
  const { usage } = useSubscriptionViewModel();
  const quotaReached = role === 'agent' && !editId && !!usage && usage.used >= usage.quota;
  const { propertyTypes, isLoading: propertyTypesLoading } = useTaxonomyViewModel();
  const { submit, saveDraft, update } = useListingSubmissionViewModel();
  // enabled: !!agentId inside the hook itself — a no-op fetch for non-agents.
  const { profile: agentProfile } = useAgentProfileViewModel();
  // Ownership proof/utility bill exemption only extends to an
  // AGENCY-affiliated agent (the agency's own onboarding verification
  // covers its staff) — an independent agent (no agency) isn't vetted by
  // anyone else, so they're required to upload the same as an owner.
  // Mirrors the identical agency_id distinction the server now makes in
  // getDocumentCompleteness.
  const isIndependentAgent = role === 'agent' && !agentProfile?.agency;
  // Any individual — owner or independent (non-agency) agent — needs the
  // same one-time CNIC+selfie identity check before their first listing;
  // an agency-affiliated agent is exempt (their agency's own onboarding
  // covers them instead).
  const { verification, isLoading: verificationLoading, becomeOwner } = useOwnerVerificationViewModel();
  // 'owner' role is retired — isIndependentAgent alone covers this now,
  // since the promotion below lands a fresh buyer on role='agent' with no
  // agency.
  const needsIdentityVerification = isIndependentAgent && !editId && !verificationLoading && verification?.status !== 'verified';

  // No signup path ever grants 'agent' directly for a plain buyer — every
  // fresh individual signup is 'buyer' by default. Self-promote once,
  // silently, the moment a buyer reaches this screen (nothing gates mobile
  // nav by role, unlike web's middleware.ts, so no extra wiring needed
  // there). (Kept the becomeOwner/isPromotingOwner names — the endpoint
  // they call now promotes to 'agent', not 'owner'.)
  const isPromotingOwner = role === 'buyer' && !editId;
  useEffect(() => {
    if (isPromotingOwner && !becomeOwner.isPending && !becomeOwner.isSuccess) {
      becomeOwner.mutate();
    }
  }, [isPromotingOwner]);

  const [editListing, setEditListing] = useState<Listing | undefined>(undefined);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!editId) return;
    listingsRepository
      .findMine({ listingId: editId, pageSize: 1 })
      .then(({ items }) => setEditListing(items[0]))
      .catch(() => showToast('Failed to load listing for editing — please try again.', 'error'));
  }, [editId, showToast]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    purpose: 'sale' as ListingPurpose,
    propertyTypeId: '',
    city: '',
    area: '',
    society: '',
    subArea: '',
    bedrooms: '',
    bathrooms: '',
    areaValue: '',
    areaUnit: 'marla' as AreaUnit,
    yearBuilt: '',
    floorLevel: '',
    furnishingStatus: '' as FurnishingStatus | '',
    installmentAvailable: false,
    readyForPossession: false,
    advanceAmount: '',
    numberOfInstallments: '',
    monthlyInstallment: '',
    balloonPaymentAvailable: false,
    balloonPaymentAmount: '',
    ballotingFeeApplicable: false,
    ballotingFeeAmount: '',
    possessionFeeApplicable: false,
    possessionFeeAmount: '',
    developmentFeeApplicable: false,
    developmentFeeAmount: '',
    mobile: '',
    landline: '',
    mobileDialCode: '92',
    landlineDialCode: '92',
  });
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string | undefined>(undefined);
  const [selectedAmenities, setSelectedAmenities] = useState<AmenitySelectionMap>(new Map());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  // Same as apps/web's submit page: undefined = first item is cover by
  // default, otherwise whichever id was explicitly picked via "Set cover".
  const [coverId, setCoverId] = useState<string | undefined>(undefined);

  // Ownership proof/utility bill — deferred-upload pattern (same as
  // apps/web's submit page): a brand-new listing has no id yet, so a picked
  // file is held here and only actually uploaded once handleSubmit/
  // handleSaveDraft has a real id. uploadedDocTypes tracks what's already
  // on the server for an existing (editId) listing, fetched below.
  const [documentFiles, setDocumentFiles] = useState<Partial<Record<ListingDocumentType, { uri: string; name: string; type: string }>>>({});
  const [uploadedDocTypes, setUploadedDocTypes] = useState<Set<ListingDocumentType>>(new Set());
  const [uploadingDocType, setUploadingDocType] = useState<ListingDocumentType | null>(null);

  // Wizard step state — mirrors apps/web's submit page's step/
  // maxStepReached/canContinue pattern. Nothing else about form state
  // changes; this only gates which STEPS block renders and which step
  // pills are tappable.
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  useEffect(() => {
    if (!editId) return;
    listingsRepository
      .listDocuments(editId)
      .then((docs) => setUploadedDocTypes(new Set(docs.map((d) => d.documentType))))
      .catch(() => undefined);
  }, [editId]);

  // Required for independent agents (no agency) — only an agency-affiliated
  // agent is exempt, mirrors the server's getDocumentCompleteness exemption.
  // ('owner' role retired.)
  const documentsRequired = isIndependentAgent;
  const documentsComplete =
    !documentsRequired ||
    REQUIRED_LISTING_DOCUMENT_TYPES.every((type) => uploadedDocTypes.has(type) || !!documentFiles[type]);

  // Same fields/shape as apps/web's submit page's canContinue — Details
  // folds this screen's old "Price and Area" + "Installments" sections into
  // one step, so it gates on both areaValue and price together rather than
  // web's two separate steps for those.
  function canContinue(index: number): boolean {
    if (index === 0) return form.title.trim() !== '' && form.description.trim() !== '' && form.propertyTypeId.trim() !== '';
    if (index === 1) return form.city.trim() !== '' && form.area.trim() !== '';
    if (index === 2) return form.areaValue.trim() !== '' && form.price.trim() !== '';
    if (index === 5) return documentsComplete;
    return true;
  }

  function goNext() {
    if (!canContinue(step)) {
      showToast('Please fill in the required fields to continue.', 'error');
      return;
    }
    setStep((s) => {
      const next = Math.min(STEPS.length - 1, s + 1);
      setMaxStepReached((m) => Math.max(m, next));
      return next;
    });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function goToStep(index: number) {
    if (index > maxStepReached) return;
    setStep(index);
  }

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const activeCategoryTab = selectedCategoryTab ?? categories[0]?.slug;
  const typesInActiveCategory = propertyTypes.filter((type) => type.category?.slug === activeCategoryTab);
  const selectedPropertyType = propertyTypes.find((type) => type.id === form.propertyTypeId);
  // Airbnb-style categorized mandatory media (Document Verification Phase
  // 4) — derived from the bedrooms/bathrooms already collected above, not
  // property type (property_type_categories is admin-configurable data).
  const requiredMediaCategories = getRequiredMediaCategories(form.bedrooms, form.bathrooms);

  function update_<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'propertyTypeId') setSelectedAmenities(new Map());
  }

  useEffect(() => {
    if (!editListing || prefilled || propertyTypesLoading) return;
    const mobileContact = editListing.contactNumbers.find((c) => c.type === 'mobile');
    const landlineContact = editListing.contactNumbers.find((c) => c.type === 'landline');
    setForm({
      title: editListing.title,
      description: editListing.description ?? '',
      price: String(editListing.price),
      purpose: editListing.purpose,
      propertyTypeId: propertyTypes.find((t) => t.slug === editListing.propertyType.slug)?.id ?? '',
      city: editListing.city,
      area: editListing.area,
      society: editListing.society ?? '',
      subArea: editListing.subArea ?? '',
      bedrooms: editListing.bedrooms != null ? String(editListing.bedrooms) : '',
      bathrooms: editListing.bathrooms != null ? String(editListing.bathrooms) : '',
      areaValue: String(editListing.areaValue),
      areaUnit: editListing.areaUnit,
      yearBuilt: editListing.yearBuilt != null ? String(editListing.yearBuilt) : '',
      floorLevel: editListing.floorLevel ?? '',
      furnishingStatus: editListing.furnishingStatus ?? '',
      installmentAvailable: editListing.installmentAvailable,
      readyForPossession: editListing.readyForPossession,
      advanceAmount: editListing.advanceAmount != null ? String(editListing.advanceAmount) : '',
      numberOfInstallments: editListing.numberOfInstallments != null ? String(editListing.numberOfInstallments) : '',
      monthlyInstallment: editListing.monthlyInstallment != null ? String(editListing.monthlyInstallment) : '',
      balloonPaymentAvailable: editListing.balloonPaymentAvailable,
      balloonPaymentAmount: editListing.balloonPaymentAmount != null ? String(editListing.balloonPaymentAmount) : '',
      ballotingFeeApplicable: editListing.ballotingFeeApplicable,
      ballotingFeeAmount: editListing.ballotingFeeAmount != null ? String(editListing.ballotingFeeAmount) : '',
      possessionFeeApplicable: editListing.possessionFeeApplicable,
      possessionFeeAmount: editListing.possessionFeeAmount != null ? String(editListing.possessionFeeAmount) : '',
      developmentFeeApplicable: editListing.developmentFeeApplicable,
      developmentFeeAmount: editListing.developmentFeeAmount != null ? String(editListing.developmentFeeAmount) : '',
      mobile: mobileContact?.number ?? '',
      landline: landlineContact?.number ?? '',
      mobileDialCode: mobileContact ? mobileContact.countryCode.replace(/\D/g, '') : '92',
      landlineDialCode: landlineContact ? landlineContact.countryCode.replace(/\D/g, '') : '92',
    });
    setSelectedCategoryTab(editListing.propertyType.category.slug);
    setSelectedAmenities(
      new Map(editListing.amenities.map((a) => [a.slug, { value: a.value ?? undefined, textValue: a.textValue ?? undefined }])),
    );
    const prefillMedia = editListing.media.map((m) => ({
      id: `${m.url}-${m.sortOrder}`,
      uri: m.url,
      type: m.type,
      status: 'done' as const,
      url: m.url,
      isCover: m.isCover,
      category: m.category ?? undefined,
    }));
    setMediaItems(prefillMedia.map(({ id, uri, type, status, url, category }) => ({ id, uri, type, status, url, category })));
    setCoverId(prefillMedia.find((m) => m.isCover)?.id);
    setPrefilled(true);
    // Editing an existing listing unlocks every step immediately — no
    // reason to force a re-walk through Property->Location->... in order
    // when every field is already filled in. Mirrors web's identical
    // setMaxStepReached(STEPS.length - 1) on edit.
    setMaxStepReached(STEPS.length - 1);
  }, [editListing, prefilled, propertyTypes, propertyTypesLoading]);

  async function pickMedia(category?: string) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    for (const asset of result.assets) {
      const id = `${asset.uri}-${Date.now()}`;
      const isVideo = asset.type === 'video';
      setMediaItems((prev) => [...prev, { id, uri: asset.uri, type: isVideo ? 'video' : 'image', status: 'uploading', category }]);

      try {
        const filename = asset.uri.split('/').pop() ?? `upload.${isVideo ? 'mp4' : 'jpg'}`;
        const mimeType = asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg');
        const { url, type } = await listingsRepository.uploadListingMedia({ uri: asset.uri, name: filename, type: mimeType });
        setMediaItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'done', url, type } : m)));
      } catch {
        setMediaItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'error' } : m)));
      }
    }
  }

  function removeMedia(id: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    if (coverId === id) setCoverId(undefined);
  }

  function openAddFeatures() {
    if (!selectedPropertyType) {
      showToast('Select a property type first.', 'error');
      return;
    }
    navigation.navigate('AddFeatures', {
      categorySlug: selectedPropertyType.category.slug,
      initialSelection: selectedAmenities,
      onDone: setSelectedAmenities,
    });
  }

  function buildInput(): CreateListingInput {
    const contactNumbers: CreateListingInput['contactNumbers'] = [];
    if (form.mobile) {
      contactNumbers.push({ type: 'mobile', countryCode: `+${form.mobileDialCode.replace(/\D/g, '')}`, number: form.mobile });
    }
    if (form.landline) {
      contactNumbers.push({ type: 'landline', countryCode: `+${form.landlineDialCode.replace(/\D/g, '')}`, number: form.landline });
    }

    return {
      title: form.title,
      description: form.description || undefined,
      price: Number(form.price),
      purpose: form.purpose,
      propertyTypeId: form.propertyTypeId,
      city: form.city,
      area: form.area,
      society: form.society || undefined,
      subArea: form.subArea || undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms.replace('+', '')) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms.replace('+', '')) : undefined,
      areaValue: Number(form.areaValue),
      areaUnit: form.areaUnit,
      yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
      floorLevel: form.floorLevel || undefined,
      furnishingStatus: form.furnishingStatus || undefined,
      installmentAvailable: form.installmentAvailable,
      readyForPossession: form.readyForPossession,
      advanceAmount: form.installmentAvailable && form.advanceAmount ? Number(form.advanceAmount) : undefined,
      numberOfInstallments: form.installmentAvailable && form.numberOfInstallments ? Number(form.numberOfInstallments) : undefined,
      monthlyInstallment: form.installmentAvailable && form.monthlyInstallment ? Number(form.monthlyInstallment) : undefined,
      balloonPaymentAvailable: form.installmentAvailable && form.balloonPaymentAvailable,
      balloonPaymentAmount:
        form.installmentAvailable && form.balloonPaymentAvailable && form.balloonPaymentAmount
          ? Number(form.balloonPaymentAmount)
          : undefined,
      ballotingFeeApplicable: form.installmentAvailable && form.ballotingFeeApplicable,
      ballotingFeeAmount:
        form.installmentAvailable && form.ballotingFeeApplicable && form.ballotingFeeAmount ? Number(form.ballotingFeeAmount) : undefined,
      possessionFeeApplicable: form.installmentAvailable && form.possessionFeeApplicable,
      possessionFeeAmount:
        form.installmentAvailable && form.possessionFeeApplicable && form.possessionFeeAmount
          ? Number(form.possessionFeeAmount)
          : undefined,
      developmentFeeApplicable: form.installmentAvailable && form.developmentFeeApplicable,
      developmentFeeAmount:
        form.installmentAvailable && form.developmentFeeApplicable && form.developmentFeeAmount
          ? Number(form.developmentFeeAmount)
          : undefined,
      contactNumbers: contactNumbers.length ? contactNumbers : undefined,
      amenities: Array.from(selectedAmenities.entries()).map(([slug, selection]) => ({
        slug,
        value: selection.value,
        textValue: selection.textValue,
      })),
      media: mediaItems
        .filter((m): m is MediaItem & { url: string } => m.status === 'done' && !!m.url)
        .map((m, index) => ({
          url: m.url,
          type: m.type,
          isCover: coverId ? m.id === coverId : index === 0,
          sortOrder: index,
          category: m.category,
        })),
    };
  }

  // Uploads whatever was picked in the Ownership Documents section
  // (deferred until now since a brand-new listing has no id beforehand) —
  // a no-op loop when documentFiles is empty (e.g. an agent, or a draft
  // saved before picking any files).
  async function uploadPendingDocuments(listingId: string) {
    const entries = Object.entries(documentFiles) as [ListingDocumentType, { uri: string; name: string; type: string }][];
    for (const [documentType, file] of entries) {
      await listingsRepository.uploadDocument(listingId, documentType, file);
    }
  }

  async function handleSubmit() {
    // Per-room photo minimums (requiredMediaCategories) are guidance only,
    // not a hard block — product decision: a listing can be published with
    // any amount of media, including none.
    // Ownership proof/utility bill are only required for individual owners
    // posting without an agent — agents are exempt (spec: "The agents do
    // not need to upload property ownership documents").
    if (!documentsComplete) {
      showToast('Upload both ownership documents before submitting.', 'error');
      return;
    }

    const input = buildInput();
    try {
      if (editId) {
        await update.mutateAsync({ listingId: editId, input });
        await uploadPendingDocuments(editId);
        showToast('Listing updated.');
      } else {
        const created = await submit.mutateAsync(input);
        await uploadPendingDocuments(created.id);
        showToast('Listing submitted for verification.');
      }
      // submit/update already invalidate ['listings'] on success, but that
      // fires before uploadPendingDocuments finishes — without this second
      // invalidation, My Properties/Home/Search can refetch and briefly
      // render the new listing with no photos yet.
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      navigation.navigate('MyProperties');
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    }
  }

  async function handleSaveDraft() {
    const input = buildInput();
    try {
      const created = await saveDraft.mutateAsync(input);
      await uploadPendingDocuments(created.id);
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      showToast('Draft saved.');
      navigation.navigate('MyProperties', { initialTab: 'drafts' });
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    }
  }

  const isPending = submit.isPending || update.isPending || saveDraft.isPending;

  if (isPromotingOwner) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateTitle}>Setting up your account…</Text>
        {becomeOwner.isError ? (
          <>
            <Text style={styles.gateSubtitle}>Something went wrong — please try again.</Text>
            <Button label="Retry" onPress={() => becomeOwner.mutate()} size="lg" />
          </>
        ) : (
          <Text style={styles.gateSubtitle}>One moment while we get you ready to list a property.</Text>
        )}
      </View>
    );
  }

  if (needsIdentityVerification) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateTitle}>Verify Your Identity</Text>
        <Text style={styles.gateSubtitle}>
          Before posting your first listing, we need a quick one-time identity check — your CNIC and a selfie.
        </Text>
        <Button label="Verify Identity" onPress={() => navigation.navigate('OwnerIdentityVerification')} size="lg" />
      </View>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <View style={styles.wizardRoot}>
      {/* HEADER — the native stack header is hidden (see RootNavigator) since
          this row already is the screen's header; insets.top replaces the
          top safe-area padding the native header used to provide. */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{editId ? 'Edit Listing' : 'Post A Listing'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <View style={styles.stepperWrap}>
        <Stepper steps={STEPS} activeIndex={step} maxReachedIndex={maxStepReached} onStepPress={goToStep} />
      </View>

      <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PROPERTY */}
        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>Tell us about your property</Text>
            <Text style={styles.stepSubtitle}>Start with the basic details of your listing.</Text>

            <TextInput
              label="Title"
              value={form.title}
              onChangeText={(v) => update_('title', v)}
              placeholder="e.g. 10 Marla House in DHA Phase 5"
              caption="A short, descriptive headline for your listing."
              style={styles.pillOverride}
            />
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(v) => update_('description', v)}
              multiline
              placeholder="Describe the property, its condition and nearby landmarks..."
              style={styles.pillOverrideMultiline}
            />

            {/* PURPOSE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Purpose</Text>
              <View style={styles.segmentedControl}>
                {[
                  { id: 'sale', label: 'For Sale' },
                  { id: 'rent', label: 'For Rent' },
                ].map((p) => {
                  const isActive = form.purpose === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => update_('purpose', p.id as ListingPurpose)}
                      style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                    >
                      <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* PROPERTY TYPE — 3 square icon cards */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Property Type</Text>
              <View style={styles.categoryCardRow}>
                {categories.map((c) => {
                  const isActive = activeCategoryTab === c.slug;
                  return (
                    <Pressable
                      key={c.slug}
                      onPress={() => setSelectedCategoryTab(c.slug)}
                      style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[c.slug] ?? 'home-outline'}
                        size={22}
                        color={isActive ? theme.colors.figma.primary : '#6B7280'}
                      />
                      <Text style={[styles.categoryCardText, isActive && styles.categoryCardTextActive]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SUBTYPE — wrapped pills */}
            {typesInActiveCategory.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Subtype</Text>
                <View style={styles.chipRow}>
                  {typesInActiveCategory.map((type) => {
                    const active = form.propertyTypeId === type.id;
                    return (
                      <Pressable
                        key={type.id}
                        onPress={() => update_('propertyTypeId', type.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{type.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* LOCATION */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>Where is it located?</Text>
            <Text style={styles.stepSubtitle}>Help buyers find your property.</Text>
            <PickerField value={form.city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" onChange={(v) => update_('city', v)} style={styles.pillOverride} />
            <PlacesAutocompleteInput label="Area / Location" value={form.area} onChange={(v) => update_('area', v)} style={styles.pillOverride} />
            <TextInput label="Society / Phase / Block" value={form.society} onChangeText={(v) => update_('society', v)} style={styles.pillOverride} />
            <TextInput label="Sub-area" value={form.subArea} onChangeText={(v) => update_('subArea', v)} style={styles.pillOverride} />
          </View>
        )}

        {/* DETAILS — Price and Area + Installments folded into one step */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>Property details</Text>
            <Text style={styles.stepSubtitle}>Pricing, size and payment terms.</Text>

            <TextInput label="Price (PKR)" value={form.price} onChangeText={(v) => update_('price', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <TextInput label="Area Value" value={form.areaValue} onChangeText={(v) => update_('areaValue', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Area Unit</Text>
                <PickerField value={form.areaUnit} options={AREA_UNITS} title="Area Unit" onChange={(v) => update_('areaUnit', v as AreaUnit)} style={styles.pillOverride} />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Bedrooms</Text>
                <PickerField value={form.bedrooms} options={BEDROOM_OPTIONS} title="Bedrooms" onChange={(v) => update_('bedrooms', v)} style={styles.pillOverride} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>Bathrooms</Text>
                <PickerField value={form.bathrooms} options={BATHROOM_OPTIONS} title="Bathrooms" onChange={(v) => update_('bathrooms', v)} style={styles.pillOverride} />
              </View>
            </View>
            <TextInput label="Year Built" value={form.yearBuilt} onChangeText={(v) => update_('yearBuilt', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
            <TextInput label="Floor Level" value={form.floorLevel} onChangeText={(v) => update_('floorLevel', v)} style={styles.pillOverride} />
            <Text style={styles.fieldLabel}>Furnishing Status</Text>
            <PickerField
              value={form.furnishingStatus}
              options={FURNISHING_STATUSES}
              title="Furnishing Status"
              onChange={(v) => update_('furnishingStatus', v as FurnishingStatus)}
              style={styles.pillOverride}
            />

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <Text style={styles.sectionTitleNoMargin}>Installments Available</Text>
              <Switch
                value={form.installmentAvailable}
                onValueChange={(v) => update_('installmentAvailable', v)}
                trackColor={{ true: theme.colors.figma.primary, false: theme.colors.border }}
              />
            </View>
            {form.installmentAvailable && (
              <View style={styles.conditionalGroup}>
                {/* TODO: balloonPaymentAmount/ballotingFeeAmount/possessionFeeAmount/
                    developmentFeeAmount exist in form state but have no rendered
                    inputs anywhere in this screen — pre-existing gap, carried
                    forward unchanged by this step-wizard restructuring. */}
                <TextInput label="Advance Amount" value={form.advanceAmount} onChangeText={(v) => update_('advanceAmount', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
                <TextInput label="Number of Installments" value={form.numberOfInstallments} onChangeText={(v) => update_('numberOfInstallments', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
                <TextInput label="Monthly Installment" value={form.monthlyInstallment} onChangeText={(v) => update_('monthlyInstallment', v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.pillOverride} />
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Ready for Possession</Text>
                  <Switch value={form.readyForPossession} onValueChange={(v) => update_('readyForPossession', v)} trackColor={{ true: theme.colors.figma.primary, false: theme.colors.border }} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* FEATURES */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>What features does it have?</Text>
            <Text style={styles.stepSubtitle}>Select the amenities that apply.</Text>
            {selectedAmenities.size > 0 && (
              <Text style={styles.mutedText}>{selectedAmenities.size} feature(s) selected</Text>
            )}
            <Button variant="secondary" label="Add Features" onPress={openAddFeatures} />
          </View>
        )}

        {/* MEDIA — Airbnb-style categorized mandatory media */}
        {step === 4 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>Add photos and videos</Text>
            <Text style={styles.stepSubtitle}>High-quality media gets more views.</Text>
            <Text style={styles.mutedText}>Photo counts below are recommended, not required — add as many or as few as you have.</Text>
            {requiredMediaCategories.map((cat) => {
              const items = mediaItems.filter((m) => m.category === cat.slug);
              const doneCount = items.filter((m) => m.status === 'done').length;
              const satisfied = doneCount >= cat.minCount;
              return (
                <Accordion
                  key={cat.slug}
                  icon={cat.required && !satisfied ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  label={cat.required ? `${cat.label} (${doneCount}/${cat.minCount})` : `${cat.label}${items.length ? ` (${items.length})` : ''}`}
                >
                  <MediaCategoryGrid
                    items={items}
                    coverId={coverId ?? mediaItems[0]?.id}
                    onRemove={removeMedia}
                    onSetCover={setCoverId}
                  />
                  <Button variant="secondary" label="Add Photos" onPress={() => pickMedia(cat.slug)} />
                </Accordion>
              );
            })}
          </View>
        )}

        {/* DOCUMENTS — required for owners and independent agents (no
            agency); an agency-affiliated agent still gets this step's pill,
            but sees a pass-through note instead of the upload rows. */}
        {step === 5 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>Ownership documents</Text>
            <Text style={styles.stepSubtitle}>Verify you own or represent this property.</Text>
            {documentsRequired ? (
              <>
                <Text style={styles.gateSubtitle}>
                  Upload proof of ownership so our team can verify this listing. Both documents are required before
                  you can submit.
                </Text>
                <DocumentUploadRow
                  label="Ownership Document"
                  uploaded={uploadedDocTypes.has('ownership_proof')}
                  hasPendingFile={!!documentFiles.ownership_proof}
                  isUploading={uploadingDocType === 'ownership_proof'}
                  onPick={async (file) => {
                    if (!editId) {
                      setDocumentFiles((prev) => ({ ...prev, ownership_proof: file }));
                      return;
                    }
                    setUploadingDocType('ownership_proof');
                    try {
                      await listingsRepository.uploadDocument(editId, 'ownership_proof', file);
                      setUploadedDocTypes((prev) => new Set(prev).add('ownership_proof'));
                      showToast('Ownership Document uploaded.');
                    } catch {
                      showToast('Upload failed — please try again.', 'error');
                    } finally {
                      setUploadingDocType(null);
                    }
                  }}
                />
                <DocumentUploadRow
                  label="Utility Bill"
                  uploaded={uploadedDocTypes.has('utility_bill')}
                  hasPendingFile={!!documentFiles.utility_bill}
                  isUploading={uploadingDocType === 'utility_bill'}
                  onPick={async (file) => {
                    if (!editId) {
                      setDocumentFiles((prev) => ({ ...prev, utility_bill: file }));
                      return;
                    }
                    setUploadingDocType('utility_bill');
                    try {
                      await listingsRepository.uploadDocument(editId, 'utility_bill', file);
                      setUploadedDocTypes((prev) => new Set(prev).add('utility_bill'));
                      showToast('Utility Bill uploaded.');
                    } catch {
                      showToast('Upload failed — please try again.', 'error');
                    } finally {
                      setUploadingDocType(null);
                    }
                  }}
                />
              </>
            ) : (
              <Text style={styles.mutedText}>
                No documents required for your account — your agency's onboarding already covers this.
              </Text>
            )}
          </View>
        )}

        {/* CONTACT */}
        {step === 6 && (
          <View style={styles.section}>
            <Text style={styles.stepHeading}>How can buyers reach you?</Text>
            <Text style={styles.stepSubtitle}>We'll only share this with serious inquiries.</Text>
            <PhoneField label="Mobile" value={form.mobile} onChangeText={(v) => update_('mobile', v)} dialCode={form.mobileDialCode} onDialCodeChange={(v) => update_('mobileDialCode', v)} />
            <PhoneField label="Landline" value={form.landline} onChangeText={(v) => update_('landline', v)} dialCode={form.landlineDialCode} onDialCodeChange={(v) => update_('landlineDialCode', v)} />

            {usage && role === 'agent' && !editId && (
              <Text style={[styles.quotaText, quotaReached && styles.quotaTextReached]}>
                {usage.used} of {usage.quota} listings used on your plan
                {quotaReached && (
                  <>
                    {' '}
                    — quota reached,{' '}
                    <Text style={styles.quotaLink} onPress={() => navigation.navigate('Plan')}>
                      upgrade your plan
                    </Text>{' '}
                    to publish more.
                  </>
                )}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <WizardFooter
        onBack={goBack}
        backDisabled={step === 0}
        isLastStep={isLastStep}
        onContinue={goNext}
        continueDisabled={!canContinue(step)}
        onSaveDraft={!editId ? handleSaveDraft : undefined}
        saveDraftLabel={saveDraft.isPending ? 'Saving…' : 'Save as Draft'}
        onSubmit={handleSubmit}
        submitLabel={isPending ? (editId ? 'Saving…' : 'Submitting…') : editId ? 'Save Changes' : 'Submit for Verification'}
        submitDisabled={isPending || quotaReached}
      />
    </View>
  );
}

function MediaCategoryGrid({
  items,
  coverId,
  onRemove,
  onSetCover,
}: {
  items: MediaItem[];
  coverId: string | undefined;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.mediaGrid}>
      {items.map((item) => {
        const isCover = item.id === coverId;
        return (
          <View key={item.id} style={styles.mediaThumbWrap}>
            {item.uri ? <Image source={{ uri: item.uri }} style={styles.mediaThumb} /> : <View style={styles.mediaThumb} />}
            {isCover && item.status === 'done' && (
              <View style={styles.mediaCoverBadge}>
                <Text style={styles.mediaCoverBadgeText}>Cover</Text>
              </View>
            )}
            <Text style={styles.mediaStatus}>
              {item.status === 'uploading' ? 'Uploading…' : item.status === 'error' ? 'Failed' : item.type}
            </Text>
            {item.status === 'done' && !isCover && (
              <Pressable onPress={() => onSetCover(item.id)}>
                <Text style={styles.mediaSetCover}>Set cover</Text>
              </Pressable>
            )}
            <Pressable onPress={() => onRemove(item.id)}>
              <Text style={styles.mediaRemove}>Remove</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// One row per required document type in the Ownership Documents section.
// hasPendingFile (deferred, new-listing case) and uploaded (already on the
// server, editing case) are mutually exclusive in practice but both
// checked so the row reads correctly either way. Mirrors
// ListingDocumentsScreen.tsx's DocumentRow picker/permission flow.
function DocumentUploadRow({
  label,
  uploaded,
  hasPendingFile,
  isUploading,
  onPick,
}: {
  label: string;
  uploaded: boolean;
  hasPendingFile: boolean;
  isUploading: boolean;
  onPick: (file: { uri: string; name: string; type: string }) => void;
}) {
  const { showToast } = useToast();
  const done = uploaded || hasPendingFile;

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const filename = asset.uri.split('/').pop() ?? 'document.jpg';
    const mimeType = asset.mimeType ?? 'image/jpeg';
    onPick({ uri: asset.uri, name: filename, type: mimeType });
  }

  return (
    <View style={styles.docRow}>
      <View>
        <Text style={styles.fieldLabel}>{label}</Text>
        {uploaded && <Text style={styles.docUploaded}>Uploaded</Text>}
        {!uploaded && hasPendingFile && <Text style={styles.docPending}>Selected — uploads when you submit</Text>}
      </View>
      <Button
        variant="dashed"
        label={isUploading ? 'Uploading…' : done ? 'Replace' : 'Upload'}
        onPress={handlePick}
        disabled={isUploading}
      />
    </View>
  );
}

function PhoneField({
  label,
  value,
  onChangeText,
  dialCode,
  onDialCodeChange,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (dialCode: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCodeWrapper}>
          <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={onDialCodeChange} style={styles.pillOverride} />
        </View>
        <TextInput
          style={[styles.phoneInput, styles.pillOverride]}
          value={value}
          maxLength={getMaxPhoneDigits(dialCode)}
          onChangeText={(text: string) => onChangeText(text.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
          keyboardType="number-pad"
          placeholder="3XXXXXXXXX"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Rounds the shared TextInput/PickerField's default theme.radius.sm
  // (6px) corners up to a full pill, matching the rest of this wizard's
  // Figma redesign (segmented control, category cards, buttons are all
  // fully rounded already) — same escape hatch PostProjectScreen/
  // ProfileSettingsScreen use rather than changing the shared default.
  pillOverride: { borderRadius: 999 },
  // Multiline (Description) stays a rounded rectangle, not a stadium — a
  // fully-rounded pill on a multi-line box reads oddly once it's tall.
  pillOverrideMultiline: { borderRadius: 16 },

  gateContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  gateTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  gateSubtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: 8 },

  // --- Step wizard chrome ---
  wizardRoot: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  // Balances BackButton's width so the title stays visually centered.
  headerSpacer: { width: 40 },
  headerDivider: { height: 1, backgroundColor: theme.colors.figma.border },
  stepperWrap: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  stepHeading: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  stepSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 4 },

  root: {
    flex: 1,
    backgroundColor: theme.colors.bg
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32
  },
  section: {
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surfaceAlt,
    marginVertical: 28,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.colors.text, 
    marginBottom: 4,
  },
  sectionTitleNoMargin: {
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.colors.text, 
  },
  fieldGroup: { 
    gap: 8,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  docUploaded: { fontSize: 12, color: theme.colors.primary, marginTop: 2 },
  docPending: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  mutedText: {
    fontSize: 13, 
    fontWeight: '500',
    color: theme.colors.mutedLight,
    marginTop: 4,
  },
  
  // --- NEW: Premium Segmented Controls ---
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    padding: 4,
    marginTop: 4,
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

  // --- Subtype pills — flat border+tint selection (no gradient ring),
  // matching the Figma reference's flatter look. ---
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  },
  chip: {
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24, // Full pill shape
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: theme.colors.figma.primary,
    borderWidth: 1.5,
    backgroundColor: '#EAF5F0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted
  },
  chipTextActive: {
    color: theme.colors.figma.primary,
  },

  // --- Property Type — 3 square icon cards ---
  categoryCardRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  categoryCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.figma.border,
    backgroundColor: theme.colors.figma.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryCardActive: {
    borderColor: theme.colors.figma.primary,
    backgroundColor: '#EAF5F0',
  },
  categoryCardText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  categoryCardTextActive: { color: theme.colors.figma.primary },

  // Layout Grids
  row2: { 
    flexDirection: 'row', 
    gap: 16,
    marginTop: 8,
  },
  flex1: { 
    flex: 1, 
    gap: 8 
  },
  switchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  conditionalGroup: {
    gap: 16,
    marginTop: 8,
  },

  // Media Grid
  mediaGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 16 
  },
  mediaThumbWrap: { 
    width: 100, 
    gap: 6 
  },
  mediaThumb: { 
    width: 100, 
    height: 100, 
    borderRadius: 12, 
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mediaStatus: { 
    fontSize: 11, 
    fontWeight: '600',
    color: theme.colors.muted 
  },
  mediaRemove: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.danger
  },
  mediaCoverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mediaCoverBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.bg,
  },
  mediaControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mediaSetCover: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Phone Inputs Fix
  phoneRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  countryCodeWrapper: {
    width: 125, // Fixed width prevents the text from wrapping inside the picker
  },
  phoneInput: { 
    flex: 1 
  },

  quotaText: { marginTop: 16, fontSize: 12, fontWeight: '500', color: theme.colors.muted, textAlign: 'center' },
  quotaTextReached: { color: theme.colors.danger },
  quotaLink: { fontWeight: '700', textDecorationLine: 'underline' },
});