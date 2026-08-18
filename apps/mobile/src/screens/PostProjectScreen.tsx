import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TextInput as RNTextInput, View, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  AreaUnit,
  CreateDeveloperInput,
  CreateProjectPaymentPlanInput,
  CreateProjectUnitTypeInput,
  PAKISTAN_CITIES,
  ProjectStatus,
  projectsRepository,
  useAgentProfileViewModel,
  useAuthViewModel,
  useDevelopersViewModel,
  useManageProjectsViewModel,
  useOwnerVerificationViewModel,
  useProjectDetailViewModel,
  useSubscriptionViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, Dialog, PickerField, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { PlacesAutocompleteInput } from '../components/PlacesAutocompleteInput';

// FIGMA COLORS
const FIGMA_BG = '#FFFFFF';
const FIGMA_CARD_BG = '#FFFFFF'; 
const FIGMA_PRIMARY = '#0F5A3E';
const FIGMA_BORDER = '#E2E8F0';
const FIGMA_MUTED = '#64748B';
const FIGMA_TEXT = '#0F172A';

const PROJECT_STEPS = [
  { key: 'basics', label: 'Property' },
  { key: 'location', label: 'Location' },
  { key: 'units', label: 'Unit Types' },
  { key: 'payment', label: 'Payment' },
  { key: 'media', label: 'Media' },
  { key: 'amenities', label: 'Features' },
];

const STEP_TITLES = [
  'Tell us about your property',
  'Where is it located?',
  'Define the unit types',
  'Add payment plans',
  'Upload media & documents',
  'Select amenities',
];

const STEP_SUBTITLES = [
  'Start with the basic details of your listing.',
  'Help buyers find your project accurately.',
  'What properties are available in this project?',
  'Provide installment and pricing details.',
  'High quality images attract more leads.',
  'Highlight the key features of your project.',
];

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const STATUS_LABELS: Record<Exclude<ProjectStatus, 'draft'>, string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
};
const STATUS_KEYS = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];

const EMPTY_UNIT_TYPE: CreateProjectUnitTypeInput = { label: '', propertyTypeSlug: '', areaUnit: 'marla' };
const EMPTY_PAYMENT_PLAN: CreateProjectPaymentPlanInput = { label: '' };
const EMPTY_DEVELOPER: CreateDeveloperInput = { name: '', slug: '', city: '', phone: '' };

interface MediaItem {
  id: string;
  uri: string;
  name?: string;
  kind: 'image' | 'document';
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function slotFromUrl(url: string): MediaItem {
  const name = url.split('/').pop() ?? url;
  const kind: MediaItem['kind'] = name.toLowerCase().endsWith('.pdf') ? 'document' : 'image';
  return { id: url, uri: url, name, kind, status: 'done', url };
}

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  if (slug.includes('home') || slug.includes('resident') || slug.includes('house')) return 'home-outline';
  if (slug.includes('plot') || slug.includes('land')) return 'map-outline';
  if (slug.includes('commercial') || slug.includes('business')) return 'business-outline';
  return 'home-outline';
}

export function PostProjectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostProject'>>();
  const editProjectId = route.params?.editProjectId;
  const viewOnly = !!route.params?.viewOnly;
  const { showToast } = useToast();

  const { developers, create: createDeveloper } = useDevelopersViewModel();
  const { propertyTypes } = useTaxonomyViewModel();
  const { create, update } = useManageProjectsViewModel();
  const { project, isLoading: projectLoading } = useProjectDetailViewModel(editProjectId);

  const { role } = useAuthViewModel();
  const { usage } = useSubscriptionViewModel();
  const quotaReached = role === 'agent' && !editProjectId && !!usage && usage.projectUsed >= usage.projectQuota;
  
  const { profile: agentProfile } = useAgentProfileViewModel();
  const isIndependentAgent = role === 'agent' && !agentProfile?.agency;
  
  const { verification, isLoading: verificationLoading } = useOwnerVerificationViewModel();
  const needsIdentityVerification =
    isIndependentAgent && !editProjectId && !verificationLoading && verification?.status !== 'verified';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [developerId, setDeveloperId] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<Exclude<ProjectStatus, 'draft'>>('planned');
  const [possessionDate, setPossessionDate] = useState('');

  const [cover, setCover] = useState<MediaItem | null>(null);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [floorPlans, setFloorPlans] = useState<MediaItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [brochure, setBrochure] = useState<MediaItem | null>(null);

  const [unitTypes, setUnitTypes] = useState<CreateProjectUnitTypeInput[]>([{ ...EMPTY_UNIT_TYPE }]);
  const [unitTypeCategorySlugs, setUnitTypeCategorySlugs] = useState<string[]>(['']);
  const [paymentPlans, setPaymentPlans] = useState<CreateProjectPaymentPlanInput[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [developerDialogOpen, setDeveloperDialogOpen] = useState(false);
  const [developerForm, setDeveloperForm] = useState<CreateDeveloperInput>(EMPTY_DEVELOPER);

  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setSlug(project.slug);
    setSlugTouched(true);
    setDeveloperId(project.developer.id);
    setDescription(project.description ?? '');
    setCity(project.city);
    setArea(project.area);
    if (project.status !== 'draft') setStatus(project.status);
    setPossessionDate(project.possessionDate ?? '');
    setCover(project.coverImageUrl ? slotFromUrl(project.coverImageUrl) : null);
    setGallery((project.galleryImageUrls ?? []).map(slotFromUrl));
    setFloorPlans((project.floorPlanUrls ?? []).map(slotFromUrl));
    setVideoUrl(project.videoUrl ?? '');
    setBrochure(project.brochureUrl ? slotFromUrl(project.brochureUrl) : null);
    setUnitTypes(
      project.unitTypes?.length
        ? project.unitTypes.map((u) => ({
            label: u.label,
            propertyTypeSlug: u.propertyType.slug,
            areaValueMin: u.areaValueMin != null ? Number(u.areaValueMin) : undefined,
            areaValueMax: u.areaValueMax != null ? Number(u.areaValueMax) : undefined,
            areaUnit: u.areaUnit,
            priceMin: u.priceMin != null ? Number(u.priceMin) : undefined,
            priceMax: u.priceMax != null ? Number(u.priceMax) : undefined,
            bedrooms: u.bedrooms ?? undefined,
            bathrooms: u.bathrooms ?? undefined,
          }))
        : [{ ...EMPTY_UNIT_TYPE }],
    );
    setUnitTypeCategorySlugs(
      project.unitTypes?.length ? project.unitTypes.map((u) => u.propertyType.category?.slug ?? '') : [''],
    );
    setPaymentPlans(
      (project.paymentPlans ?? []).map((p) => ({
        label: p.label,
        bookingPercent: p.bookingPercent ?? undefined,
        installmentCount: p.installmentCount ?? undefined,
        installmentFrequency: p.installmentFrequency ?? undefined,
        balloonPaymentCount: p.balloonPaymentCount ?? undefined,
        planDocumentUrl: p.planDocumentUrl ?? undefined,
        description: p.description ?? undefined,
      })),
    );
    setSelectedAmenities((project.amenities ?? []).map((a) => a.slug));
    setMaxStepReached(PROJECT_STEPS.length - 1);
  }, [project]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCreateDeveloper() {
    if (!developerForm.name || !developerForm.slug) {
      showToast('Name and slug are required.', 'error');
      return;
    }
    try {
      const developer = await createDeveloper.mutateAsync(developerForm);
      showToast('Developer added.');
      setDeveloperId(developer.id);
      setDeveloperDialogOpen(false);
      setDeveloperForm(EMPTY_DEVELOPER);
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    }
  }

  async function pickSingleImage(set: (item: MediaItem | null) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const id = `${asset.uri}-${Date.now()}`;
    set({ id, uri: asset.uri, kind: 'image', status: 'uploading' });
    try {
      const filename = asset.uri.split('/').pop() ?? 'upload.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const { url } = await projectsRepository.uploadMedia({ uri: asset.uri, name: filename, type: mimeType });
      set({ id, uri: asset.uri, kind: 'image', status: 'done', url });
    } catch {
      set({ id, uri: asset.uri, kind: 'image', status: 'error' });
      showToast('Upload failed — please try again.', 'error');
    }
  }

  async function pickManyImages(set: React.Dispatch<React.SetStateAction<MediaItem[]>>) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    for (const asset of result.assets) {
      const id = `${asset.uri}-${Date.now()}`;
      set((prev) => [...prev, { id, uri: asset.uri, kind: 'image', status: 'uploading' }]);
      try {
        const filename = asset.uri.split('/').pop() ?? 'upload.jpg';
        const mimeType = asset.mimeType ?? 'image/jpeg';
        const { url } = await projectsRepository.uploadMedia({ uri: asset.uri, name: filename, type: mimeType });
        set((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'done', url } : m)));
      } catch {
        set((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'error' } : m)));
        showToast('Upload failed — please try again.', 'error');
      }
    }
  }

  async function pickDocument(onUploaded: (url: string) => void, set?: (item: MediaItem | null) => void) {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    const asset = result.assets[0];
    const id = `${asset.uri}-${Date.now()}`;
    set?.({ id, uri: asset.uri, name: asset.name, kind: 'document', status: 'uploading' });
    try {
      const { url } = await projectsRepository.uploadMedia({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' });
      set?.({ id, uri: asset.uri, name: asset.name, kind: 'document', status: 'done', url });
      onUploaded(url);
    } catch {
      set?.({ id, uri: asset.uri, name: asset.name, kind: 'document', status: 'error' });
      showToast('Upload failed — please try again.', 'error');
    }
  }

  function updateUnitType(index: number, patch: Partial<CreateProjectUnitTypeInput>) {
    setUnitTypes((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  function updateUnitTypeCategory(index: number, categorySlug: string) {
    setUnitTypeCategorySlugs((prev) => prev.map((c, i) => (i === index ? categorySlug : c)));
    updateUnitType(index, { propertyTypeSlug: '' });
  }

  function updatePaymentPlan(index: number, patch: Partial<CreateProjectPaymentPlanInput>) {
    setPaymentPlans((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function buildInput() {
    return {
      name,
      slug,
      developerId,
      description: description || undefined,
      city,
      area,
      status,
      possessionDate: possessionDate || undefined,
      coverImageUrl: cover?.status === 'done' ? cover.url : undefined,
      galleryImageUrls: gallery.filter((m) => m.status === 'done' && m.url).map((m) => m.url!),
      floorPlanUrls: floorPlans.filter((m) => m.status === 'done' && m.url).map((m) => m.url!),
      videoUrl: videoUrl || undefined,
      brochureUrl: brochure?.status === 'done' ? brochure.url : undefined,
      unitTypes: unitTypes.filter((u) => u.label && u.propertyTypeSlug),
      paymentPlans: paymentPlans.filter((p) => p.label),
      amenitySlugs: selectedAmenities,
    };
  }

  function validate(index: number): boolean {
    if (index === 0) return !!name && !!slug && !!developerId;
    if (index === 1) return !!city && !!area;
    return true;
  }

  function goNext() {
    if (!validate(step)) {
      showToast('Please fill in all required fields to continue.', 'error');
      return;
    }
    setStep((s) => {
      const next = Math.min(PROJECT_STEPS.length - 1, s + 1);
      setMaxStepReached((m) => Math.max(m, next));
      return next;
    });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function goToStep(index: number) {
    if (index > maxStepReached && !viewOnly && !editProjectId) return;
    setStep(index);
  }

  async function handleSubmit() {
    if (viewOnly) return;
    if (!validate(0) || !validate(1)) {
      showToast('Please complete the required fields in Basics and Location.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const input = buildInput();
      if (editProjectId) {
        await update.mutateAsync({ id: editProjectId, input });
        showToast('Project updated.');
      } else {
        await create.mutateAsync(input);
        showToast('Project created.');
      }
      navigation.navigate('MyProjects');
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (viewOnly || editProjectId || !validate(0)) return;
    setSavingDraft(true);
    try {
      await create.mutateAsync({ ...buildInput(), status: 'draft' });
      showToast('Draft saved.');
      navigation.navigate('MyProjects');
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  if (needsIdentityVerification) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateTitle}>Verify Your Identity</Text>
        <Text style={styles.gateSubtitle}>
          Before posting your first project, we need a quick one-time identity check — your CNIC and a selfie.
        </Text>
        <Button label="Verify Identity" onPress={() => navigation.navigate('OwnerIdentityVerification')} size="lg" />
      </View>
    );
  }

  if (editProjectId && projectLoading) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const isPending = submitting || savingDraft;
  const isLastStep = step === PROJECT_STEPS.length - 1;
  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  return (
    <View style={styles.root}>
      {/* HEADER & WIZARD */}
      <View style={styles.headerArea}>
        <FigmaStepper steps={PROJECT_STEPS} currentStep={step} onStepPress={goToStep} />

        <View style={styles.titleArea}>
          <Text style={styles.mainTitle}>{STEP_TITLES[step]}</Text>
          <Text style={styles.subTitle}>{STEP_SUBTITLES[step]}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollRoot} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 0: BASICS — one continuous card, not three stacked ones.
            Each card carries its own top/bottom padding, so three of them
            back-to-back (even with stepContainer's 16px gap) read as a much
            bigger gap than the spacing within a single card. */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <View style={styles.card}>
              <View style={styles.fieldSpacingBottom}>
                <FigmaField label="Project Name *" value={name} onChangeText={handleNameChange} editable={!viewOnly} placeholder="e.g. Marina Heights Suites" />
                <Text style={styles.helperText}>A short, descriptive headline for your project.</Text>
              </View>

              <View style={styles.fieldSpacingBottom}>
                <FigmaField label="URL Slug *" value={slug} onChangeText={(v) => { setSlugTouched(true); setSlug(v); }} editable={!viewOnly} placeholder="e.g. marina-heights" />
              </View>

              <View style={styles.fieldSpacingBottom}>
                <FigmaField label="Description" value={description} onChangeText={setDescription} editable={!viewOnly} placeholder="Describe the project, its condition and nearby landmarks..." multiline />
              </View>

              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Project Status</Text>
                <View style={styles.segmentedControl}>
                  {STATUS_KEYS.map((k) => (
                    <Pressable
                      key={k}
                      style={[styles.segmentTab, status === k && styles.segmentTabActive]}
                      onPress={() => !viewOnly && setStatus(k)}
                    >
                      <Text style={[styles.segmentTabText, status === k && styles.segmentTabTextActive]}>
                        {STATUS_LABELS[k]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.figmaLabel}>Developer *</Text>
                <View style={styles.rowCentered}>
                  <View style={styles.flex1}>
                    <PickerField
                      value={developers.find((d) => d.id === developerId)?.name ?? ''}
                      options={developers.map((d) => d.name)}
                      placeholder="Select Developer"
                      title="Select Developer"
                      disabled={viewOnly}
                      onChange={(label) => setDeveloperId(developers.find((d) => d.name === label)?.id ?? '')}
                      style={styles.pillOverride}
                    />
                  </View>
                  {!viewOnly && (
                    <Pressable style={styles.addSquareBtn} onPress={() => setDeveloperDialogOpen(true)}>
                      <Ionicons name="add" size={24} color={FIGMA_PRIMARY} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 1: LOCATION */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.card}>
              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>City *</Text>
                <PickerField value={city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" disabled={viewOnly} onChange={setCity} style={styles.pillOverride} />
              </View>
              
              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Area / Locality *</Text>
                <PlacesAutocompleteInput value={area} onChange={setArea} editable={!viewOnly} placeholder="e.g. Clifton, Karachi" style={styles.pillOverride} inputStyle={styles.pillOverride} hideLabel />
              </View>

              <View style={styles.fieldSpacingBottom}>
                <FigmaDateField label="Possession Date" value={possessionDate} onChange={setPossessionDate} editable={!viewOnly} placeholder="Select date" />
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: UNIT TYPES */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            {unitTypes.map((u, index) => {
              const typesInCategory = unitTypeCategorySlugs[index]
                ? propertyTypes.filter((pt) => pt.category?.slug === unitTypeCategorySlugs[index])
                : [];
                
              return (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Unit Type {index + 1}</Text>
                    {!viewOnly && (
                      <Pressable onPress={() => setUnitTypes((prev) => prev.filter((_, i) => i !== index))} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.fieldSpacingBottom}>
                    <FigmaField label="Label *" value={u.label} onChangeText={(v) => updateUnitType(index, { label: v })} editable={!viewOnly} placeholder="e.g. 2 Bed Apartment" />
                  </View>

                  {/* Visual Category Squares */}
                  <View style={styles.fieldSpacingBottom}>
                    <Text style={styles.figmaLabel}>Property Type</Text>
                    <View style={styles.categorySquaresRow}>
                      {categories.map((c) => {
                        const isActive = unitTypeCategorySlugs[index] === c.slug;
                        return (
                          <Pressable key={c.slug} style={[styles.categorySquare, isActive && styles.categorySquareActive]} onPress={() => !viewOnly && updateUnitTypeCategory(index, c.slug)}>
                            <Ionicons name={getCategoryIcon(c.slug)} size={24} color={isActive ? FIGMA_PRIMARY : FIGMA_MUTED} />
                            <Text style={[styles.categorySquareText, isActive && styles.categorySquareTextActive]}>{c.label}</Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>

                  {/* Subtype Pills */}
                  {typesInCategory.length > 0 && (
                    <View style={styles.fieldSpacingBottom}>
                      <Text style={styles.figmaLabel}>Subtype</Text>
                      <View style={styles.subtypePillRow}>
                        {typesInCategory.map((pt) => {
                          const isActive = u.propertyTypeSlug === pt.slug;
                          return (
                            <Pressable key={pt.slug} style={[styles.subtypePill, isActive && styles.subtypePillActive]} onPress={() => !viewOnly && updateUnitType(index, { propertyTypeSlug: pt.slug })}>
                              <Text style={[styles.subtypePillText, isActive && styles.subtypePillTextActive]}>{pt.label}</Text>
                            </Pressable>
                          )
                        })}
                      </View>
                    </View>
                  )}

                  <View style={styles.fieldSpacingBottom}>
                    <View style={styles.rowStretched}>
                      <View style={styles.flex1}><FigmaField label="Area Min" value={u.areaValueMin?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { areaValueMin: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                      <View style={styles.flex1}><FigmaField label="Area Max" value={u.areaValueMax?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { areaValueMax: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                    </View>
                  </View>
                  
                  <View style={styles.fieldSpacingBottom}>
                    <Text style={styles.figmaLabel}>Area Unit</Text>
                    <PickerField value={u.areaUnit} options={AREA_UNITS} title="Area Unit" disabled={viewOnly} onChange={(v) => updateUnitType(index, { areaUnit: v as AreaUnit })} style={styles.pillOverride} />
                  </View>

                  <View style={styles.fieldSpacingBottom}>
                    <View style={styles.rowStretched}>
                      <View style={styles.flex1}><FigmaField label="Price Min" value={u.priceMin?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { priceMin: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                      <View style={styles.flex1}><FigmaField label="Price Max" value={u.priceMax?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { priceMax: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                    </View>
                  </View>

                  <View style={styles.fieldSpacingBottom}>
                    <View style={styles.rowStretched}>
                      <View style={styles.flex1}><FigmaField label="Bedrooms" value={u.bedrooms?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { bedrooms: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                      <View style={styles.flex1}><FigmaField label="Bathrooms" value={u.bathrooms?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { bathrooms: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                    </View>
                  </View>
                </View>
              );
            })}
            
            {!viewOnly && (
              <Pressable
                style={styles.outlineAddButton}
                onPress={() => {
                  setUnitTypes((prev) => [...prev, { ...EMPTY_UNIT_TYPE }]);
                  setUnitTypeCategorySlugs((prev) => [...prev, '']);
                }}
              >
                <Ionicons name="add" size={18} color={FIGMA_PRIMARY} />
                <Text style={styles.outlineAddButtonText}>Add Unit Type</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* STEP 3: PAYMENT PLANS */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            {paymentPlans.map((p, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Plan {index + 1}</Text>
                  {!viewOnly && (
                    <Pressable onPress={() => setPaymentPlans((prev) => prev.filter((_, i) => i !== index))} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    </Pressable>
                  )}
                </View>
                
                <View style={styles.fieldSpacingBottom}>
                  <FigmaField label="Plan Name" value={p.label} onChangeText={(v) => updatePaymentPlan(index, { label: v })} editable={!viewOnly} placeholder="e.g. 3-Year Easy Installments" />
                </View>
                
                <View style={styles.fieldSpacingBottom}>
                  <View style={styles.rowStretched}>
                    <View style={styles.flex1}><FigmaField label="Booking %" value={p.bookingPercent?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { bookingPercent: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                    <View style={styles.flex1}><FigmaField label="Installments" value={p.installmentCount?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { installmentCount: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" /></View>
                  </View>
                </View>

                <View style={styles.fieldSpacingBottom}>
                  <FigmaField label="Installment Frequency" value={p.installmentFrequency ?? ''} onChangeText={(v) => updatePaymentPlan(index, { installmentFrequency: v })} editable={!viewOnly} placeholder="e.g. Quarterly" />
                </View>
                
                <View style={styles.fieldSpacingBottom}>
                  <FigmaField label="Balloon Payments" value={p.balloonPaymentCount?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { balloonPaymentCount: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>

                <View style={styles.fieldSpacingBottom}>
                  <Text style={styles.figmaLabel}>Plan Document</Text>
                  {p.planDocumentUrl ? (
                    <Text style={styles.helperText} numberOfLines={1}>{p.planDocumentUrl.split('/').pop()}</Text>
                  ) : (
                    !viewOnly && (
                      <Pressable style={styles.outlineAddButton} onPress={() => pickDocument((url) => updatePaymentPlan(index, { planDocumentUrl: url }))}>
                        <Ionicons name="document-attach-outline" size={18} color={FIGMA_PRIMARY} />
                        <Text style={styles.outlineAddButtonText}>Upload PDF</Text>
                      </Pressable>
                    )
                  )}
                </View>

                <View style={styles.fieldSpacingBottom}>
                  <FigmaField label="Description" value={p.description ?? ''} onChangeText={(v) => updatePaymentPlan(index, { description: v })} editable={!viewOnly} multiline />
                </View>
              </View>
            ))}
            
            {!viewOnly && (
              <Pressable style={styles.outlineAddButton} onPress={() => setPaymentPlans((prev) => [...prev, { ...EMPTY_PAYMENT_PLAN }])}>
                <Ionicons name="add" size={18} color={FIGMA_PRIMARY} />
                <Text style={styles.outlineAddButtonText}>Add Payment Plan</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* STEP 4: MEDIA */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.card}>
              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Cover Image</Text>
                {cover ? (
                  <MediaThumb item={cover} onRemove={() => setCover(null)} readOnly={viewOnly} />
                ) : (
                  !viewOnly && (
                    <Pressable style={styles.mediaUploadBox} onPress={() => pickSingleImage(setCover)}>
                      <Ionicons name="cloud-upload-outline" size={28} color={FIGMA_MUTED} />
                      <Text style={styles.mediaUploadText}>Upload Cover Image</Text>
                    </Pressable>
                  )
                )}
              </View>

              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Gallery Images</Text>
                {gallery.length > 0 && (
                  <View style={styles.mediaGrid}>
                    {gallery.map((m) => (
                      <MediaThumb key={m.id} item={m} onRemove={() => setGallery((prev) => prev.filter((g) => g.id !== m.id))} readOnly={viewOnly} />
                    ))}
                  </View>
                )}
                {!viewOnly && (
                  <Pressable style={styles.mediaUploadBox} onPress={() => pickManyImages(setGallery)}>
                    <Ionicons name="images-outline" size={28} color={FIGMA_MUTED} />
                    <Text style={styles.mediaUploadText}>Add Gallery Images</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Floor Plans</Text>
                {floorPlans.length > 0 && (
                  <View style={styles.mediaGrid}>
                    {floorPlans.map((m) => (
                      <MediaThumb key={m.id} item={m} onRemove={() => setFloorPlans((prev) => prev.filter((g) => g.id !== m.id))} readOnly={viewOnly} />
                    ))}
                  </View>
                )}
                {!viewOnly && (
                  <Pressable style={styles.mediaUploadBox} onPress={() => pickManyImages(setFloorPlans)}>
                    <Ionicons name="map-outline" size={28} color={FIGMA_MUTED} />
                    <Text style={styles.mediaUploadText}>Add Floor Plans</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.fieldSpacingBottom}>
                <FigmaField label="Video / Walkthrough URL" value={videoUrl} onChangeText={setVideoUrl} editable={!viewOnly} placeholder="https://…" />
              </View>

              <View style={styles.fieldSpacingBottom}>
                <Text style={styles.figmaLabel}>Brochure (PDF)</Text>
                {brochure ? (
                  <MediaThumb item={brochure} onRemove={() => setBrochure(null)} readOnly={viewOnly} />
                ) : (
                  !viewOnly && (
                    <Pressable style={styles.mediaUploadBox} onPress={() => pickDocument(() => {}, setBrochure)}>
                      <Ionicons name="document-text-outline" size={28} color={FIGMA_MUTED} />
                      <Text style={styles.mediaUploadText}>Upload Brochure PDF</Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          </View>
        )}

        {/* STEP 5: AMENITIES — same "Add Features" pattern as PostListingScreen:
            a draft-then-commit screen (per-category accordions) reached by
            navigation rather than an inline picker, so listings and projects
            present amenities with one consistent UI. */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.card}>
              <Text style={styles.helperText}>Tap to select the amenities included in this project.</Text>
              {selectedAmenities.length > 0 && (
                <Text style={styles.amenitySummaryText}>{selectedAmenities.length} feature(s) selected</Text>
              )}
              <Button
                variant="secondary"
                label="Add Features"
                onPress={() =>
                  !viewOnly &&
                  navigation.navigate('ProjectAmenities', {
                    initialSelection: selectedAmenities,
                    onDone: setSelectedAmenities,
                  })
                }
                disabled={viewOnly}
                style={{ marginTop: 12 }}
              />
            </View>
            
            {!editProjectId && (
              <Pressable style={{ marginTop: 24, alignSelf: 'center' }} onPress={handleSaveDraft} disabled={isPending}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: FIGMA_MUTED, textDecorationLine: 'underline' }}>{savingDraft ? 'Saving Draft...' : 'Save as Draft'}</Text>
              </Pressable>
            )}

            {usage && role === 'agent' && !editProjectId && (
              <Text style={[styles.quotaText, quotaReached && styles.quotaTextReached]}>
                {usage.projectUsed} of {usage.projectQuota} projects used on your plan
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

      {/* FIXED FOOTER */}
      <View style={styles.footer}>
        <Pressable style={[styles.footerBtn, styles.footerBtnOutline]} onPress={goBack} disabled={step === 0}>
          <Text style={[styles.footerBtnOutlineText, step === 0 && { color: '#CBD5E1' }]}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.footerBtn, styles.footerBtnSolid, (isPending || (isLastStep && quotaReached)) && { opacity: 0.7 }]}
          onPress={isLastStep ? handleSubmit : goNext}
          disabled={isPending || (isLastStep && quotaReached)}
        >
          <Text style={styles.footerBtnSolidText}>
            {isPending ? 'Processing...' : (isLastStep ? (editProjectId ? 'Save Changes' : 'Publish Project') : 'Continue')}
          </Text>
        </Pressable>
      </View>

      <Dialog open={developerDialogOpen} onClose={() => setDeveloperDialogOpen(false)} title="New Developer">
        <View style={styles.dialogContent}>
          <View style={styles.fieldSpacingBottom}>
            <FigmaField label="Name" value={developerForm.name} onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, name: v, slug: slugify(v) }))} />
          </View>
          <View style={styles.fieldSpacingBottom}>
            <FigmaField label="Slug" value={developerForm.slug} onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, slug: v }))} />
          </View>
          <View style={styles.fieldSpacingBottom}>
            <Text style={styles.figmaLabel}>City</Text>
            <PickerField value={developerForm.city ?? ''} options={PAKISTAN_CITIES} title="Select City" onChange={(v) => setDeveloperForm((prev) => ({ ...prev, city: v }))} style={styles.pillOverride} />
          </View>
          <View style={styles.fieldSpacingBottom}>
            <FigmaField label="Phone" value={developerForm.phone ?? ''} onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, phone: v }))} />
          </View>
          <Button label={createDeveloper.isPending ? 'Adding…' : 'Add Developer'} onPress={handleCreateDeveloper} disabled={createDeveloper.isPending} style={{ backgroundColor: FIGMA_PRIMARY }} />
        </View>
      </Dialog>

    </View>
  );
}

// -----------------------------------------------------------------------------
// HELPER COMPONENTS
// -----------------------------------------------------------------------------

function FigmaField({
  label,
  value,
  onChangeText,
  disabled,
  editable = true,
  placeholder,
  multiline,
  keyboardType
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  disabled?: boolean;
  editable?: boolean;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.figmaLabel}>{label}</Text>
      <RNTextInput
        style={[styles.input, multiline && styles.inputMultiline, disabled && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !disabled && !!onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FIGMA_MUTED}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// Same pill-field look as FigmaField, but the tap target opens the native
// date picker instead of a keyboard — keeps possessionDate a real ISO
// 'YYYY-MM-DD' instead of whatever free-text a user types.
function FigmaDateField({
  label,
  value,
  onChange,
  disabled,
  editable = true,
  placeholder = 'Select date',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  editable?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value) : new Date();
  const isDisabled = disabled || !editable;

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(selected.toISOString().slice(0, 10));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.figmaLabel}>{label}</Text>
      <Pressable
        style={[styles.input, styles.dateInput, isDisabled && styles.inputDisabled]}
        onPress={() => !isDisabled && setShow(true)}
      >
        <Text style={[styles.dateInputText, !value && styles.datePlaceholder]}>{value || placeholder}</Text>
        <Ionicons name="calendar-outline" size={18} color={FIGMA_MUTED} />
      </Pressable>
      {show && Platform.OS === 'android' && (
        <DateTimePicker value={dateValue} mode="date" display="default" onChange={handleChange} />
      )}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={show} onRequestClose={() => setShow(false)}>
          <Pressable style={styles.datePickerOverlay} onPress={() => setShow(false)}>
            <Pressable style={styles.datePickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => setShow(false)}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker value={dateValue} mode="date" display="inline" onChange={handleChange} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

function FigmaStepper({ steps, currentStep, onStepPress }: { steps: any[], currentStep: number, onStepPress: (idx: number) => void }) {
  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepperLineTrack} />
      <View style={[styles.stepperLineFill, { width: `${(currentStep / (steps.length - 1)) * 100}%` }]} />
      <View style={styles.stepperNodes}>
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;
          const isActive = isDone || isCurrent;
          return (
            <Pressable key={step.key} style={styles.stepperNodeArea} onPress={() => onStepPress(index)}>
              <View style={[styles.stepperDot, isActive && styles.stepperDotActive, isCurrent && styles.stepperDotCurrent]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={FIGMA_BG} />
                ) : (
                  <Text style={[styles.stepperDotText, isActive && styles.stepperDotTextActive]}>{index + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepperLabel, isActive && styles.stepperLabelActive, isCurrent && styles.stepperLabelCurrent]} numberOfLines={1}>
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MediaThumb({ item, onRemove, readOnly }: { item: MediaItem; onRemove: () => void; readOnly?: boolean }) {
  return (
    <View style={styles.mediaThumbWrap}>
      {item.kind === 'image' ? (
        <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
      ) : (
        <View style={[styles.mediaThumb, styles.mediaThumbDoc]}>
          <Ionicons name="document-text-outline" size={28} color={theme.colors.muted} />
        </View>
      )}
      <Text style={styles.mediaStatus} numberOfLines={1}>
        {item.status === 'uploading' ? 'Uploading…' : item.status === 'error' ? 'Failed' : (item.name ?? item.kind)}
      </Text>
      {!readOnly && (
        <Pressable onPress={onRemove}>
          <Text style={styles.mediaRemove}>Remove</Text>
        </Pressable>
      )}
    </View>
  );
}

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FIGMA_BG },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: FIGMA_BG },
  muted: { fontSize: 14, color: FIGMA_MUTED },
  gateContainer: { flex: 1, backgroundColor: FIGMA_BG, padding: 24, justifyContent: 'center', gap: 16 },
  gateTitle: { fontSize: 20, fontWeight: '700', color: FIGMA_TEXT },
  gateSubtitle: { fontSize: 14, color: FIGMA_MUTED, marginBottom: 8 },
  quotaText: { marginTop: 16, fontSize: 12, fontWeight: '500', color: theme.colors.muted, textAlign: 'center' },
  quotaTextReached: { color: theme.colors.danger },
  quotaLink: { fontWeight: '700', textDecorationLine: 'underline' },
  
  headerArea: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: FIGMA_BG },
  titleArea: { marginBottom: 16 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: FIGMA_TEXT, letterSpacing: -0.5, marginBottom: 4 },
  subTitle: { fontSize: 13, color: FIGMA_MUTED },

  // Custom Stepper
  // Bigger numbered/checkmark nodes instead of bare 12px dots — the old
  // stepper read as a thin decorative line; this gives each step real
  // presence (a number to orient by, a checkmark once passed, a halo on
  // the current one) while staying compact enough for 6 steps in a row.
  stepperWrap: { position: 'relative', marginBottom: 30 },
  stepperLineTrack: { position: 'absolute', top: 13, left: 14, right: 14, height: 3, borderRadius: 2, backgroundColor: '#E2E8F0' },
  stepperLineFill: { position: 'absolute', top: 13, left: 14, height: 3, borderRadius: 2, backgroundColor: FIGMA_PRIMARY },
  stepperNodes: { flexDirection: 'row', justifyContent: 'space-between' },
  stepperNodeArea: { alignItems: 'center', flex: 1 },
  stepperDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FIGMA_BG,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  stepperDotActive: { backgroundColor: FIGMA_PRIMARY, borderColor: FIGMA_PRIMARY },
  // The current step additionally gets a soft brand-colored halo so it
  // reads as "you are here", distinct from steps already completed.
  stepperDotCurrent: {
    shadowColor: FIGMA_PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepperDotText: { fontSize: 12, fontWeight: '700', color: FIGMA_MUTED },
  stepperDotTextActive: { color: FIGMA_BG },
  stepperLabel: { fontSize: 11, color: FIGMA_MUTED, marginTop: 8, fontWeight: '600' },
  stepperLabelActive: { color: FIGMA_TEXT },
  stepperLabelCurrent: { color: FIGMA_PRIMARY, fontWeight: '800' },

  scrollRoot: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  stepContainer: { gap: 16 },

  card: {
    backgroundColor: FIGMA_CARD_BG,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9', 
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: FIGMA_TEXT },

  field: { gap: 6 },
  figmaLabel: { fontSize: 12, fontWeight: '600', color: FIGMA_TEXT, paddingLeft: 4 },
  helperText: { fontSize: 11, color: FIGMA_MUTED, marginTop: 2, paddingLeft: 4 },
  
  fieldSpacingBottom: { marginBottom: 16 },
  
  // ALL INPUTS FORCE PILL SHAPE 
  input: {
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    borderRadius: 999, // Pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: FIGMA_TEXT,
    backgroundColor: FIGMA_CARD_BG,
    height: 48,
  },
  inputMultiline: {
    borderRadius: 16,
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputDisabled: { backgroundColor: '#F8FAFC', color: FIGMA_MUTED },
  pillOverride: { borderRadius: 999, height: 48 },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInputText: { fontSize: 14, color: FIGMA_TEXT },
  datePlaceholder: { color: FIGMA_MUTED },
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  datePickerSheet: { backgroundColor: FIGMA_CARD_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA_BORDER,
  },
  datePickerCancel: { fontSize: 15, fontWeight: '600', color: FIGMA_MUTED },
  datePickerDone: { fontSize: 15, fontWeight: '700', color: FIGMA_PRIMARY },

  // Segmented Control
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 999, padding: 4, marginTop: 6, borderWidth: 1, borderColor: FIGMA_BORDER },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 999 },
  segmentTabActive: { backgroundColor: FIGMA_PRIMARY, shadowColor: FIGMA_PRIMARY, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentTabText: { fontSize: 13, fontWeight: '600', color: FIGMA_MUTED },
  segmentTabTextActive: { color: FIGMA_CARD_BG, fontWeight: '700' },

  rowCentered: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowStretched: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  flex1: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  
  addSquareBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: FIGMA_PRIMARY, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4' },
  outlineAddButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: FIGMA_PRIMARY, borderRadius: 999, marginTop: 8 },
  outlineAddButtonText: { fontSize: 14, fontWeight: '600', color: FIGMA_PRIMARY },

  // Unit Types - Category Grid
  categorySquaresRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 10 },
  categorySquare: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: FIGMA_BORDER, alignItems: 'center', justifyContent: 'center', backgroundColor: FIGMA_CARD_BG, gap: 8 },
  categorySquareActive: { borderColor: FIGMA_PRIMARY, backgroundColor: '#F0FDF4' },
  categorySquareText: { fontSize: 11, fontWeight: '600', color: FIGMA_MUTED },
  categorySquareTextActive: { color: FIGMA_PRIMARY },

  // Unit Types - Subtype Pills
  subtypePillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  subtypePill: { borderWidth: 1, borderColor: FIGMA_BORDER, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: FIGMA_CARD_BG },
  subtypePillActive: { borderColor: FIGMA_PRIMARY, backgroundColor: '#F0FDF4' },
  subtypePillText: { fontSize: 12, fontWeight: '600', color: FIGMA_MUTED },
  subtypePillTextActive: { color: FIGMA_PRIMARY },

  // Media Grid
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  mediaUploadBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: FIGMA_BORDER, borderRadius: 16, height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 8, marginTop: 6 },
  mediaUploadText: { fontSize: 12, fontWeight: '600', color: FIGMA_MUTED },
  mediaThumbWrap: { width: 100, gap: 4 },
  mediaThumb: { width: 100, height: 100, borderRadius: 12, backgroundColor: FIGMA_CARD_BG, borderWidth: 1, borderColor: FIGMA_BORDER },
  mediaThumbDoc: { alignItems: 'center', justifyContent: 'center' },
  mediaStatus: { fontSize: 11, fontWeight: '600', color: FIGMA_MUTED },
  mediaRemove: { fontSize: 11, fontWeight: '700', color: theme.colors.danger },

  // Amenities — the actual picker now lives in ProjectAmenitiesScreen
  // (opened via navigation, same as PostListingScreen's Add Features);
  // this is just the summary line on the wizard step.
  amenitySummaryText: { fontSize: 13, color: FIGMA_MUTED, fontWeight: '500', marginTop: 8 },

  // Fixed Bottom Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32, 
    backgroundColor: FIGMA_BG,
    borderTopWidth: 1,
    borderTopColor: FIGMA_BORDER,
  },
  footerBtn: { flex: 1, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  footerBtnOutline: { borderWidth: 1, borderColor: FIGMA_BORDER, backgroundColor: FIGMA_CARD_BG },
  footerBtnOutlineText: { color: FIGMA_MUTED, fontWeight: '700', fontSize: 14 },
  footerBtnSolid: { backgroundColor: FIGMA_PRIMARY },
  footerBtnSolidText: { color: FIGMA_BG, fontWeight: '700', fontSize: 14 },

  dialogContent: { gap: 12 },
});