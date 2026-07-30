import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, Pressable, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AreaUnit,
  COUNTRIES,
  CreateListingInput,
  FurnishingStatus,
  Listing,
  ListingPurpose,
  PAKISTAN_CITIES,
  getMaxPhoneDigits,
  listingsRepository,
  useListingSubmissionViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, CountryCodeField, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { AmenitySelectionMap } from './AddFeaturesScreen';

// Selected-state border for the property type chips — RN has no CSS
// border-image, so the gradient is faked by wrapping the chip in a
// LinearGradient "ring" (padding = border width) with a solid-bg inner View.
const SELECTION_BORDER_GRADIENT = ['rgba(13, 99, 75, 0.6)', 'rgba(3, 75, 55, 0.6)'] as [string, string];

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES: FurnishingStatus[] = ['unfurnished', 'semi_furnished', 'furnished'];
const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'];

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

export function PostListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostListing'>>();
  const editId = route.params?.editListingId;
  const { showToast } = useToast();
  const { propertyTypes, isLoading: propertyTypesLoading } = useTaxonomyViewModel();
  const { submit, saveDraft, update } = useListingSubmissionViewModel();

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

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const activeCategoryTab = selectedCategoryTab ?? categories[0]?.slug;
  const typesInActiveCategory = propertyTypes.filter((type) => type.category?.slug === activeCategoryTab);
  const selectedPropertyType = propertyTypes.find((type) => type.id === form.propertyTypeId);

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
    }));
    setMediaItems(prefillMedia.map(({ id, uri, type, status, url }) => ({ id, uri, type, status, url })));
    setCoverId(prefillMedia.find((m) => m.isCover)?.id);
    setPrefilled(true);
  }, [editListing, prefilled, propertyTypes, propertyTypesLoading]);

  async function pickMedia() {
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
      setMediaItems((prev) => [...prev, { id, uri: asset.uri, type: isVideo ? 'video' : 'image', status: 'uploading' }]);

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

  function moveMedia(id: string, direction: -1 | 1) {
    setMediaItems((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
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
        })),
    };
  }

  async function handleSubmit() {
    const input = buildInput();
    try {
      if (editId) {
        await update.mutateAsync({ listingId: editId, input });
        showToast('Listing updated.');
      } else {
        await submit.mutateAsync(input);
        showToast('Listing submitted for verification.');
      }
      navigation.navigate('MyProperties');
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    }
  }

  async function handleSaveDraft() {
    const input = buildInput();
    try {
      await saveDraft.mutateAsync(input);
      showToast('Draft saved.');
      navigation.navigate('MyProperties', { initialTab: 'drafts' });
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    }
  }

  const isPending = submit.isPending || update.isPending || saveDraft.isPending;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* BASIC INFORMATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <TextInput label="Title" value={form.title} onChangeText={(v) => update_('title', v)} />
        <TextInput label="Description" value={form.description} onChangeText={(v) => update_('description', v)} multiline />

        {/* CUSTOM SEGMENTED CONTROL: PURPOSE */}
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

        {/* CUSTOM SEGMENTED CONTROL: PROPERTY CATEGORY */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Property Type</Text>
          {categories.length > 0 && (
            <View style={styles.segmentedControl}>
              {categories.map((c) => {
                const isActive = activeCategoryTab === c.slug;
                return (
                  <Pressable
                    key={c.slug}
                    onPress={() => setSelectedCategoryTab(c.slug)}
                    style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                  >
                    <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          
          {/* MODERN PROPERTY TYPE CHIPS */}
          <View style={styles.chipRow}>
            {typesInActiveCategory.map((type) => {
              const active = form.propertyTypeId === type.id;
              return active ? (
                <Pressable key={type.id} onPress={() => update_('propertyTypeId', type.id)}>
                  <LinearGradient
                    colors={SELECTION_BORDER_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.chipGradientBorder}
                  >
                    <View style={styles.chipInner}>
                      <Text style={[styles.chipText, styles.chipTextActive]}>{type.label}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable key={type.id} onPress={() => update_('propertyTypeId', type.id)} style={styles.chip}>
                  <Text style={styles.chipText}>{type.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* LOCATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <PickerField value={form.city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" onChange={(v) => update_('city', v)} />
        <TextInput label="Area / Location" value={form.area} onChangeText={(v) => update_('area', v)} />
        <TextInput label="Society / Phase / Block" value={form.society} onChangeText={(v) => update_('society', v)} />
        <TextInput label="Sub-area" value={form.subArea} onChangeText={(v) => update_('subArea', v)} />
      </View>

      <View style={styles.divider} />

      {/* PRICE AND AREA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price and Area</Text>
        <TextInput label="Price (PKR)" value={form.price} onChangeText={(v) => update_('price', v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <View style={styles.row2}>
          <View style={styles.flex1}>
            <TextInput label="Area Value" value={form.areaValue} onChangeText={(v) => update_('areaValue', v.replace(/\D/g, ''))} keyboardType="number-pad" />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Area Unit</Text>
            <PickerField value={form.areaUnit} options={AREA_UNITS} title="Area Unit" onChange={(v) => update_('areaUnit', v as AreaUnit)} />
          </View>
        </View>
        <View style={styles.row2}>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Bedrooms</Text>
            <PickerField value={form.bedrooms} options={BEDROOM_OPTIONS} title="Bedrooms" onChange={(v) => update_('bedrooms', v)} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Bathrooms</Text>
            <PickerField value={form.bathrooms} options={BATHROOM_OPTIONS} title="Bathrooms" onChange={(v) => update_('bathrooms', v)} />
          </View>
        </View>
        <TextInput label="Year Built" value={form.yearBuilt} onChangeText={(v) => update_('yearBuilt', v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <TextInput label="Floor Level" value={form.floorLevel} onChangeText={(v) => update_('floorLevel', v)} />
        <Text style={styles.fieldLabel}>Furnishing Status</Text>
        <PickerField
          value={form.furnishingStatus}
          options={FURNISHING_STATUSES}
          title="Furnishing Status"
          onChange={(v) => update_('furnishingStatus', v as FurnishingStatus)}
        />
      </View>

      <View style={styles.divider} />

      {/* INSTALLMENTS */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitleNoMargin}>Installments Available</Text>
          <Switch
            value={form.installmentAvailable}
            onValueChange={(v) => update_('installmentAvailable', v)}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
        {form.installmentAvailable && (
          <View style={styles.conditionalGroup}>
            <TextInput label="Advance Amount" value={form.advanceAmount} onChangeText={(v) => update_('advanceAmount', v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <TextInput label="Number of Installments" value={form.numberOfInstallments} onChangeText={(v) => update_('numberOfInstallments', v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <TextInput label="Monthly Installment" value={form.monthlyInstallment} onChangeText={(v) => update_('monthlyInstallment', v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Ready for Possession</Text>
              <Switch value={form.readyForPossession} onValueChange={(v) => update_('readyForPossession', v)} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* FEATURES & AMENITIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature and Amenities</Text>
        {selectedAmenities.size > 0 && (
          <Text style={styles.mutedText}>{selectedAmenities.size} feature(s) selected</Text>
        )}
        <Pressable onPress={openAddFeatures}>
          <LinearGradient colors={theme.gradients.gold.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldButton}>
            <Text style={styles.goldButtonText}>Add Features</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* PHOTOS & VIDEOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos and Videos</Text>
        {mediaItems.length > 0 && (
          <View style={styles.mediaGrid}>
            {mediaItems.map((item, index) => {
              const isCover = coverId ? item.id === coverId : index === 0;
              return (
                <View key={item.id} style={styles.mediaThumbWrap}>
                  {item.uri ? (
                    <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
                  ) : (
                    <View style={styles.mediaThumb} />
                  )}
                  {isCover && item.status === 'done' && (
                    <View style={styles.mediaCoverBadge}>
                      <Text style={styles.mediaCoverBadgeText}>Cover</Text>
                    </View>
                  )}
                  <Text style={styles.mediaStatus}>{item.status === 'uploading' ? 'Uploading…' : item.status === 'error' ? 'Failed' : item.type}</Text>
                  {item.status === 'done' && (
                    <View style={styles.mediaControlsRow}>
                      <Pressable onPress={() => moveMedia(item.id, -1)} disabled={index === 0} hitSlop={6}>
                        <Ionicons name="chevron-back" size={16} color={index === 0 ? theme.colors.border : theme.colors.text} />
                      </Pressable>
                      {!isCover && (
                        <Pressable onPress={() => setCoverId(item.id)}>
                          <Text style={styles.mediaSetCover}>Set cover</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => moveMedia(item.id, 1)} disabled={index === mediaItems.length - 1} hitSlop={6}>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={index === mediaItems.length - 1 ? theme.colors.border : theme.colors.text}
                        />
                      </Pressable>
                    </View>
                  )}
                  <Pressable onPress={() => removeMedia(item.id)}>
                    <Text style={styles.mediaRemove}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <Pressable onPress={pickMedia}>
          <LinearGradient colors={theme.gradients.gold.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldButton}>
            <Text style={styles.goldButtonText}>Add Photos / Videos</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* CONTACT INFO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <PhoneField label="Mobile" value={form.mobile} onChangeText={(v) => update_('mobile', v)} dialCode={form.mobileDialCode} onDialCodeChange={(v) => update_('mobileDialCode', v)} />
        <PhoneField label="Landline" value={form.landline} onChangeText={(v) => update_('landline', v)} dialCode={form.landlineDialCode} onDialCodeChange={(v) => update_('landlineDialCode', v)} />
      </View>

      <View style={styles.submitContainer}>
        {!editId && (
          <Button
            label={saveDraft.isPending ? 'Saving…' : 'Save as Draft'}
            variant="secondary"
            onPress={handleSaveDraft}
            disabled={isPending}
          />
        )}
        <Button label={isPending ? (editId ? 'Saving…' : 'Submitting…') : editId ? 'Save Changes' : 'Submit for Verification'} onPress={handleSubmit} disabled={isPending} />
      </View>
    </ScrollView>
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
          <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={onDialCodeChange} />
        </View>
        <TextInput
          style={styles.phoneInput}
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
  root: { 
    flex: 1, 
    backgroundColor: theme.colors.bg
  },
  content: { 
    paddingHorizontal: 24, 
    paddingTop: 24, 
    paddingBottom: 60 
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
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
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

  // --- REFINED: Modern Property Type Chips ---
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
  chipGradientBorder: {
    borderRadius: 24,
    padding: 1.07,
  },
  chipInner: {
    backgroundColor: theme.colors.bg,
    borderRadius: 22.93,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted
  },
  chipTextActive: {
    color: theme.colors.primary,
  },

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

  // Gold Gradient Buttons
  goldButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.gradients.gold.colors[1],
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginTop: 8,
  },
  goldButtonText: {
    color: theme.colors.bg,
    fontWeight: '700',
    fontSize: 15,
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

  // Main Submit
  submitContainer: {
    marginTop: 32,
    gap: 12,
  },
});