import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AreaUnit,
  CreateDeveloperInput,
  CreateProjectPaymentPlanInput,
  CreateProjectUnitTypeInput,
  PAKISTAN_CITIES,
  ProjectStatus,
  projectsRepository,
  useDevelopersViewModel,
  useManageProjectsViewModel,
  useProjectDetailViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import { Button, Dialog, PickerField, TextInput, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

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

// Single item for Cover/Brochure; array items for Gallery/Floor Plans/per-
// unit-type plan documents. `file`-less once `status === 'done'` in
// edit/view mode (prefilled straight from an existing url, same as
// PostListingScreen.tsx's edit prefill — no re-upload needed).
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

// Unified create/edit/view form — mirrors apps/web/components/projects/
// ProjectForm.tsx section-for-section (Basics/Media/Unit Types/Payment
// Plans/Amenities), reusing the same packages/core hooks web uses
// unmodified. `editProjectId` switches create->edit (PATCH via
// useManageProjectsViewModel().update); `viewOnly` (set only by
// MyProjectsScreen when the viewer isn't the project's owner/a Super Admin)
// disables every field and hides all actions, matching ProjectForm's
// readOnly prop.
export function PostProjectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostProject'>>();
  const editProjectId = route.params?.editProjectId;
  const viewOnly = !!route.params?.viewOnly;
  const { showToast } = useToast();

  const { developers, create: createDeveloper } = useDevelopersViewModel();
  const { propertyTypes, amenities } = useTaxonomyViewModel();
  const { create, update } = useManageProjectsViewModel();
  const { project, isLoading: projectLoading } = useProjectDetailViewModel(editProjectId);

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

  // Prefill from the fetched project once, in edit/view mode.
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

  function openAmenityPicker() {
    navigation.navigate('ProjectAmenities', { initialSelection: selectedAmenities, onDone: setSelectedAmenities });
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

  function validate(): boolean {
    if (!name || !slug || !developerId || !city || !area) {
      showToast('Please fill in all required fields.', 'error');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (viewOnly || !validate()) return;
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

  // Drafts are create-only — an existing project already has a real status.
  async function handleSaveDraft() {
    if (viewOnly || editProjectId || !validate()) return;
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

  if (editProjectId && projectLoading) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const isPending = submitting || savingDraft;

  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);

  const developerName = developers.find((d) => d.id === developerId)?.name ?? '';

  const amenitiesByCategory = amenities.reduce<Record<string, typeof amenities>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* BASICS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basics</Text>
        <TextInput label="Project Name" value={name} onChangeText={handleNameChange} editable={!viewOnly} placeholder="e.g. Swiss Mall Gulberg" />
        <TextInput
          label="URL Slug"
          value={slug}
          onChangeText={(v) => {
            setSlugTouched(true);
            setSlug(v);
          }}
          editable={!viewOnly}
          placeholder="e.g. swiss-mall-gulberg"
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Developer</Text>
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <PickerField
                value={developerName}
                options={developers.map((d) => d.name)}
                placeholder="Select developer"
                title="Select Developer"
                disabled={viewOnly}
                onChange={(label) => setDeveloperId(developers.find((d) => d.name === label)?.id ?? '')}
              />
            </View>
            {!viewOnly && (
              <Pressable style={styles.addDeveloperButton} onPress={() => setDeveloperDialogOpen(true)}>
                <Ionicons name="add" size={18} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>City</Text>
          <PickerField value={city} options={PAKISTAN_CITIES} placeholder="Select City" title="Select City" disabled={viewOnly} onChange={setCity} />
        </View>

        <TextInput label="Area / Locality" value={area} onChangeText={setArea} editable={!viewOnly} placeholder="e.g. Gulberg" />

        <View style={styles.row2}>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Status</Text>
            <PickerField
              value={STATUS_LABELS[status]}
              options={STATUS_KEYS.map((k) => STATUS_LABELS[k])}
              title="Status"
              disabled={viewOnly}
              onChange={(label) => setStatus(STATUS_KEYS.find((k) => STATUS_LABELS[k] === label) ?? 'planned')}
            />
          </View>
          <View style={styles.flex1}>
            <TextInput label="Possession Date" value={possessionDate} onChangeText={setPossessionDate} editable={!viewOnly} placeholder="YYYY-MM-DD" />
          </View>
        </View>

        <TextInput label="Description" value={description} onChangeText={setDescription} editable={!viewOnly} multiline />
      </View>

      <View style={styles.divider} />

      {/* MEDIA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media</Text>

        <Text style={styles.fieldLabel}>Cover Image</Text>
        {cover ? (
          <MediaThumb item={cover} onRemove={() => setCover(null)} readOnly={viewOnly} />
        ) : (
          !viewOnly && <GoldButton label="Choose Cover Image" onPress={() => pickSingleImage(setCover)} />
        )}

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Gallery Images</Text>
        {gallery.length > 0 && (
          <View style={styles.mediaGrid}>
            {gallery.map((m) => (
              <MediaThumb key={m.id} item={m} onRemove={() => setGallery((prev) => prev.filter((g) => g.id !== m.id))} readOnly={viewOnly} />
            ))}
          </View>
        )}
        {!viewOnly && <GoldButton label="Add Gallery Images" onPress={() => pickManyImages(setGallery)} />}

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Floor Plans</Text>
        {floorPlans.length > 0 && (
          <View style={styles.mediaGrid}>
            {floorPlans.map((m) => (
              <MediaThumb key={m.id} item={m} onRemove={() => setFloorPlans((prev) => prev.filter((g) => g.id !== m.id))} readOnly={viewOnly} />
            ))}
          </View>
        )}
        {!viewOnly && <GoldButton label="Add Floor Plan Images" onPress={() => pickManyImages(setFloorPlans)} />}

        <TextInput
          label="Video / 3D Walkthrough URL"
          value={videoUrl}
          onChangeText={setVideoUrl}
          editable={!viewOnly}
          placeholder="https://…"
          style={styles.fieldSpaced}
        />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Brochure (PDF)</Text>
        {brochure ? (
          <MediaThumb item={brochure} onRemove={() => setBrochure(null)} readOnly={viewOnly} />
        ) : (
          !viewOnly && <GoldButton label="Choose Brochure PDF" onPress={() => pickDocument(() => {}, setBrochure)} />
        )}
      </View>

      <View style={styles.divider} />

      {/* UNIT TYPES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unit Types</Text>
        {unitTypes.map((u, index) => {
          const typesInCategory = unitTypeCategorySlugs[index]
            ? propertyTypes.filter((pt) => pt.category?.slug === unitTypeCategorySlugs[index])
            : [];
          const categoryLabel = categories.find((c) => c.slug === unitTypeCategorySlugs[index])?.label ?? '';
          const propertyTypeLabel = propertyTypes.find((pt) => pt.slug === u.propertyTypeSlug)?.label ?? '';
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
              <TextInput label="Label" value={u.label} onChangeText={(v) => updateUnitType(index, { label: v })} editable={!viewOnly} placeholder="e.g. 2 Bed Apartment" />
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <PickerField
                    value={categoryLabel}
                    options={categories.map((c) => c.label)}
                    title="Category"
                    disabled={viewOnly}
                    onChange={(label) => updateUnitTypeCategory(index, categories.find((c) => c.label === label)?.slug ?? '')}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.fieldLabel}>Property Type</Text>
                  <PickerField
                    value={propertyTypeLabel}
                    options={typesInCategory.map((pt) => pt.label)}
                    title="Property Type"
                    disabled={viewOnly}
                    onChange={(label) => updateUnitType(index, { propertyTypeSlug: typesInCategory.find((pt) => pt.label === label)?.slug ?? '' })}
                  />
                </View>
              </View>
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <TextInput label="Area Min" value={u.areaValueMin?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { areaValueMin: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
                <View style={styles.flex1}>
                  <TextInput label="Area Max" value={u.areaValueMax?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { areaValueMax: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
              </View>
              <Text style={styles.fieldLabel}>Area Unit</Text>
              <PickerField value={u.areaUnit} options={AREA_UNITS} title="Area Unit" disabled={viewOnly} onChange={(v) => updateUnitType(index, { areaUnit: v as AreaUnit })} />
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <TextInput label="Price Min" value={u.priceMin?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { priceMin: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
                <View style={styles.flex1}>
                  <TextInput label="Price Max" value={u.priceMax?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { priceMax: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <TextInput label="Bedrooms" value={u.bedrooms?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { bedrooms: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
                <View style={styles.flex1}>
                  <TextInput label="Bathrooms" value={u.bathrooms?.toString() ?? ''} onChangeText={(v) => updateUnitType(index, { bathrooms: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
                </View>
              </View>
            </View>
          );
        })}
        {!viewOnly && (
          <Pressable
            style={styles.addRowButton}
            onPress={() => {
              setUnitTypes((prev) => [...prev, { ...EMPTY_UNIT_TYPE }]);
              setUnitTypeCategorySlugs((prev) => [...prev, '']);
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.addRowButtonText}>Add Unit Type</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />

      {/* PAYMENT PLANS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Plans</Text>
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
            <TextInput label="Label" value={p.label} onChangeText={(v) => updatePaymentPlan(index, { label: v })} editable={!viewOnly} placeholder="e.g. 3-Year Easy Installments" />
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <TextInput label="Booking %" value={p.bookingPercent?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { bookingPercent: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
              </View>
              <View style={styles.flex1}>
                <TextInput label="Installment Count" value={p.installmentCount?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { installmentCount: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
              </View>
            </View>
            <TextInput label="Installment Frequency" value={p.installmentFrequency ?? ''} onChangeText={(v) => updatePaymentPlan(index, { installmentFrequency: v })} editable={!viewOnly} placeholder="e.g. Quarterly" />
            <TextInput label="Balloon Payment Count" value={p.balloonPaymentCount?.toString() ?? ''} onChangeText={(v) => updatePaymentPlan(index, { balloonPaymentCount: v ? Number(v) : undefined })} editable={!viewOnly} keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Plan Document</Text>
            {p.planDocumentUrl ? (
              <Text style={styles.mutedText} numberOfLines={1}>{p.planDocumentUrl.split('/').pop()}</Text>
            ) : (
              !viewOnly && <GoldButton label="Upload PDF" onPress={() => pickDocument((url) => updatePaymentPlan(index, { planDocumentUrl: url }))} />
            )}
            <TextInput label="Description" value={p.description ?? ''} onChangeText={(v) => updatePaymentPlan(index, { description: v })} editable={!viewOnly} multiline />
          </View>
        ))}
        {!viewOnly && (
          <Pressable style={styles.addRowButton} onPress={() => setPaymentPlans((prev) => [...prev, { ...EMPTY_PAYMENT_PLAN }])}>
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.addRowButtonText}>Add Payment Plan</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />

      {/* AMENITIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        {selectedAmenities.length > 0 && <Text style={styles.mutedText}>{selectedAmenities.length} amenity(s) selected</Text>}
        {!viewOnly && <GoldButton label="Add Amenities" onPress={openAmenityPicker} />}
        {viewOnly && selectedAmenities.length > 0 && (
          <View style={styles.chipRow}>
            {selectedAmenities.map((slug) => {
              const amenity = Object.values(amenitiesByCategory).flat().find((a) => a.slug === slug);
              return amenity ? (
                <View key={slug} style={styles.chip}>
                  <Text style={styles.chipText}>{amenity.label}</Text>
                </View>
              ) : null;
            })}
          </View>
        )}
      </View>

      {!viewOnly && (
        <View style={styles.submitContainer}>
          {!editProjectId && (
            <Button label={savingDraft ? 'Saving…' : 'Save as Draft'} variant="secondary" onPress={handleSaveDraft} disabled={isPending} />
          )}
          <Button label={submitting ? 'Saving…' : editProjectId ? 'Save Changes' : 'Create Project'} onPress={handleSubmit} disabled={isPending} />
        </View>
      )}

      <Dialog open={developerDialogOpen} onClose={() => setDeveloperDialogOpen(false)} title="New Developer">
        <View style={styles.dialogContent}>
          <TextInput
            label="Name"
            value={developerForm.name}
            onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, name: v, slug: slugify(v) }))}
          />
          <TextInput label="Slug" value={developerForm.slug} onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, slug: v }))} />
          <Text style={styles.fieldLabel}>City</Text>
          <PickerField
            value={developerForm.city ?? ''}
            options={PAKISTAN_CITIES}
            title="Select City"
            onChange={(v) => setDeveloperForm((prev) => ({ ...prev, city: v }))}
          />
          <TextInput label="Phone" value={developerForm.phone ?? ''} onChangeText={(v) => setDeveloperForm((prev) => ({ ...prev, phone: v }))} />
          <Button label={createDeveloper.isPending ? 'Adding…' : 'Add Developer'} onPress={handleCreateDeveloper} disabled={createDeveloper.isPending} />
        </View>
      </Dialog>
    </ScrollView>
  );
}

function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={theme.gradients.gold.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldButton}>
        <Text style={styles.goldButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  muted: { fontSize: 14, color: theme.colors.muted },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: 24, paddingBottom: 60 },
  section: { gap: 16 },
  divider: { height: 1, backgroundColor: theme.colors.surfaceAlt, marginVertical: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldLabelSpaced: { marginTop: 8 },
  fieldSpaced: { marginTop: 8 },
  mutedText: { fontSize: 13, color: theme.colors.mutedLight },
  row2: { flexDirection: 'row', gap: 16 },
  flex1: { flex: 1, gap: 8 },
  addDeveloperButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldButton: {
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  goldButtonText: { color: theme.colors.bg, fontWeight: '700', fontSize: 14 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  mediaThumbWrap: { width: 100, gap: 4 },
  mediaThumb: { width: 100, height: 100, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  mediaThumbDoc: { alignItems: 'center', justifyContent: 'center' },
  mediaStatus: { fontSize: 11, fontWeight: '600', color: theme.colors.muted },
  mediaRemove: { fontSize: 11, fontWeight: '700', color: theme.colors.danger },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  addRowButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addRowButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: theme.colors.secondaryBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  submitContainer: { marginTop: 32, gap: 12 },
  dialogContent: { gap: 12 },
});
