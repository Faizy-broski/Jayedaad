'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Reveal } from '@/components/Reveal';
import {
  Amenity,
  AreaUnit,
  COUNTRIES,
  CreateListingInput,
  FurnishingStatus,
  getMaxPhoneDigits,
  ListingPurpose,
  PAKISTAN_CITIES,
  listingsRepository,
  useAuthViewModel,
  useListingSubmissionViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  CountryCodeSelect,
  Input,
  Select,
  Switch,
  Textarea,
} from '@jayedaad/ui-web';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import {
  Bath,
  BedDouble,
  Building,
  Building2,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  CreditCard,
  DoorOpen,
  Factory,
  FileText,
  Home,
  ImageIcon,
  LandPlot,
  Layers,
  ListChecks,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  PhoneCall,
  Ruler,
  Smartphone,
  Store,
  Tag,
  Trees,
  Type,
  Upload,
  Video,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react';

// Override for categories whose reference-form tab name doesn't match the
// auto-derived `category.replace(/_/g, ' ')` — everything else falls
// through to that derivation unchanged.
const AMENITY_CATEGORY_TAB_LABELS: Partial<Record<string, string>> = {
  nearby_locations: 'Nearby Locations and Other Facilities',
};

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const FURNISHING_STATUSES: FurnishingStatus[] = ['unfurnished', 'semi_furnished', 'furnished'];
const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'];

// Hides scrollbar chrome while keeping the element scrollable (wheel/drag/
// swipe still work) — used on the step-pill strip and the amenities modal's
// internal scroll areas so no scrollbar track is ever visible.
const SCROLLBAR_HIDE =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

interface MediaItem {
  id: string;
  previewUrl: string;
  type: 'image' | 'video';
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

interface AmenitySelection {
  value?: number;
  textValue?: string;
}

// Verified against the real seed data (supabase/migrations/0005_taxonomy_seed.sql)
// — every slug below is a real property type, one icon per slug, not a
// generic fallback for all of them.
const PROPERTY_TYPE_ICONS: Record<string, LucideIcon> = {
  house: Home,
  upper_portion: Layers,
  farm_house: Trees,
  penthouse: Building2,
  flat: Building,
  lower_portion: Layers,
  room: DoorOpen,
  residential_plot: LandPlot,
  agricultural_land: Trees,
  plot_file: FileText,
  commercial_plot: LandPlot,
  industrial_land: Factory,
  plot_form: FileText,
  office: Building2,
  warehouse: Warehouse,
  building: Building,
  shop: Store,
  factory: Factory,
  other: MoreHorizontal,
};

// Wizard shell — mirrors the reference's 9-step "List a property" flow.
// Every step maps 1:1 onto the same form/state fields the single-page
// version used; nothing here changes what data is collected or how it's
// submitted, only how it's grouped and presented.
const STEPS = [
  { key: 'purpose', label: 'Purpose', question: 'What are you listing today?' },
  { key: 'basics', label: 'Basics', question: 'Basics' },
  { key: 'details', label: 'Details', question: 'Property Details' },
  { key: 'amenities', label: 'Amenities', question: "What's included?" },
  { key: 'media', label: 'Media', question: 'Upload media' },
  { key: 'pricing', label: 'Pricing', question: 'Pricing' },
  { key: 'agent', label: 'Agent', question: 'Agent information' },
  { key: 'preview', label: 'Preview', question: 'Preview your listing' },
  { key: 'publish', label: 'Publish', question: 'Ready to go live?' },
] as const;

// Owner/agent listing submission — the write side of the Manual Verification
// vertical slice [Spec §7]. Every field here maps 1:1 to CreateListingDto
// (services/api/src/listings/dto/create-listing.dto.ts); status is never a
// field the submitter controls — the API always starts pending_verification.
export default function SubmitListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') ?? undefined;
  const { user } = useAuthViewModel();
  const { propertyTypes, isLoading: propertyTypesLoading } = useTaxonomyViewModel();
  const { submit, saveDraft, update: updateMutation } = useListingSubmissionViewModel();

  const [step, setStep] = useState(0);
  // Furthest step the user has validly reached — a step pill only becomes
  // clickable once its index is <= this. Prevents skipping ahead into a
  // step whose prerequisites (previous required fields) aren't filled yet.
  const [maxStepReached, setMaxStepReached] = useState(0);

  // Edit mode fetches through /listings/mine (self-scoped, any status) —
  // the public GET /listings/:id only ever returns verified listings, which
  // would make editing a Pending/Rejected listing (the exact case this
  // exists for) impossible.
  const editListingQuery = useQuery({
    queryKey: ['listings', 'mine', 'edit', editId],
    queryFn: async () => {
      const { items } = await listingsRepository.findMine({ listingId: editId, pageSize: 1 });
      return items[0];
    },
    enabled: !!editId,
  });
  const editListing = editListingQuery.data;
  const [prefilled, setPrefilled] = useState(false);

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
  // Keyed by amenity slug — presence in the map means selected. `value` is
  // used for 'number'-valueType amenities, `textValue` for 'text' and
  // 'select' (the chosen option).
  const [selectedAmenities, setSelectedAmenities] = useState<Map<string, AmenitySelection>>(new Map());
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [draftAmenities, setDraftAmenities] = useState<Map<string, AmenitySelection>>(new Map());
  const [activeAmenityTab, setActiveAmenityTab] = useState<string | undefined>(undefined);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [coverId, setCoverId] = useState<string | undefined>(undefined);

  // Prefills every field from the fetched listing exactly once — a Listing's
  // fields map 1:1 onto this form's state (propertyType.id -> propertyTypeId,
  // contactNumbers already store countryCode/number separately so no
  // reverse-parsing is needed unlike agent-settings' single-string phone).
  useEffect(() => {
    // Guards on propertyTypesLoading too — editListing can resolve before
    // propertyTypes does (no ordering guarantee between the two queries).
    // Without this, propertyTypeId resolves against an empty list and gets
    // stuck at '' forever (prefilled blocks re-entry), which cascades into
    // an empty amenity category and hides the correctly-saved amenities.
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
      new Map(
        editListing.amenities.map((a) => [
          a.slug,
          { value: a.value ?? undefined, textValue: a.textValue ?? undefined },
        ]),
      ),
    );
    const prefillMedia = editListing.media.map((m) => ({
      id: crypto.randomUUID(),
      previewUrl: m.url,
      type: m.type,
      status: 'done' as const,
      url: m.url,
      isCover: m.isCover,
    }));
    setMediaItems(prefillMedia.map(({ isCover, ...rest }) => rest));
    setCoverId(prefillMedia.find((m) => m.isCover)?.id);
    setPrefilled(true);
    // Editing an existing listing means every step already has valid data —
    // unlock the whole wizard instead of forcing a re-walk through Continue.
    setMaxStepReached(STEPS.length - 1);
  }, [editListing, prefilled, propertyTypes, propertyTypesLoading]);

  // Amenities are scoped to the selected property type's category (Homes/
  // Plots/Commercial) — a Plot shouldn't be offered Drawing Room. Re-fetches
  // (and re-scopes) whenever the property type changes.
  const selectedCategorySlug = propertyTypes.find((type) => type.id === form.propertyTypeId)?.category?.slug;
  const { amenities, isLoading: amenitiesLoading } = useTaxonomyViewModel(selectedCategorySlug);
  const taxonomyLoading = propertyTypesLoading || amenitiesLoading;

  // Defensive: a property_types row with no joined category shouldn't crash
  // the page — skip it from the tab list rather than reading .slug off
  // undefined (a live-data gap, not something this form can fix).
  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);
  const activeCategoryTab = selectedCategoryTab ?? categories[0]?.slug;
  const typesInActiveCategory = propertyTypes.filter((type) => type.category?.slug === activeCategoryTab);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // A category change can invalidate previously-checked amenities (the API
    // now rejects amenities that don't belong to the listing's property type).
    if (key === 'propertyTypeId') setSelectedAmenities(new Map());
  }

  // Real Supabase Storage upload (POST /listings/media/upload) — files
  // upload as they're picked, before the listing exists, matching the
  // reference's live preview behavior. JPEG/PNG/WEBP get a client-side
  // canvas resize/re-encode first ("Auto-compressed" in the reference) —
  // HEIC/video pass through as-is since canvas can't decode/re-encode them.
  async function addMediaFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const isVideo = file.type.startsWith('video/');
      const previewUrl = URL.createObjectURL(file);

      setMediaItems((prev) => [
        ...prev,
        { id, previewUrl, type: isVideo ? 'video' : 'image', status: 'uploading' },
      ]);

      try {
        const uploadFile = isVideo ? file : await compressImage(file);
        const { url, type } = await listingsRepository.uploadListingMedia(uploadFile);
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

  function buildInput(): CreateListingInput {
    const contactNumbers: CreateListingInput['contactNumbers'] = [];
    if (form.mobile) {
      contactNumbers.push({ type: 'mobile', countryCode: `+${form.mobileDialCode.replace(/\D/g, '')}`, number: form.mobile });
    }
    if (form.landline) {
      contactNumbers.push({
        type: 'landline',
        countryCode: `+${form.landlineDialCode.replace(/\D/g, '')}`,
        number: form.landline,
      });
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
      numberOfInstallments:
        form.installmentAvailable && form.numberOfInstallments ? Number(form.numberOfInstallments) : undefined,
      monthlyInstallment:
        form.installmentAvailable && form.monthlyInstallment ? Number(form.monthlyInstallment) : undefined,
      balloonPaymentAvailable: form.installmentAvailable && form.balloonPaymentAvailable,
      balloonPaymentAmount:
        form.installmentAvailable && form.balloonPaymentAvailable && form.balloonPaymentAmount
          ? Number(form.balloonPaymentAmount)
          : undefined,
      ballotingFeeApplicable: form.installmentAvailable && form.ballotingFeeApplicable,
      ballotingFeeAmount:
        form.installmentAvailable && form.ballotingFeeApplicable && form.ballotingFeeAmount
          ? Number(form.ballotingFeeAmount)
          : undefined,
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = buildInput();

    try {
      if (editId) {
        await updateMutation.mutateAsync({ listingId: editId, input });
        toast.success('Listing updated.');
      } else {
        await submit.mutateAsync(input);
        toast.success('Listing submitted for verification.');
      }
      router.push('/property-management');
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  async function handleSaveDraft() {
    const input = buildInput();
    try {
      await saveDraft.mutateAsync(input);
      toast.success('Draft saved.');
      router.push('/property-management');
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  const amenitiesByCategory = amenities.reduce<Record<string, typeof amenities>>((acc, amenity) => {
    (acc[amenity.category] ??= []).push(amenity);
    return acc;
  }, {});

  const isLastStep = step === STEPS.length - 1;

  // Blocks "Continue" the same way the old single-page form's native
  // `required` attributes blocked submit — same fields, same requiredness,
  // just checked per-step instead of all at once. This now also drives the
  // Continue button's disabled state and which step pills are unlocked, not
  // just the toast shown on a blocked click.
  function canContinue(index: number): boolean {
    if (index === 0) return form.propertyTypeId.trim() !== '';
    if (index === 1) return form.title.trim() !== '' && form.city.trim() !== '' && form.area.trim() !== '';
    if (index === 2) return form.areaValue.trim() !== '';
    if (index === 5) return form.price.trim() !== '';
    return true;
  }

  const currentStepValid = canContinue(step);

  function goNext() {
    if (!currentStepValid) {
      toast.error('Please fill in the required fields to continue.');
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

  // A pill is only reachable once its step has actually been unlocked by
  // completing everything before it via Continue — jumping ahead into a
  // step whose prerequisites aren't filled in yet is not allowed.
  function goToStep(index: number) {
    if (index > maxStepReached) return;
    setStep(index);
  }

  // The submit button lives in the persistent footer (not per-step), so
  // it's always mounted — without this guard, pressing Enter in any text
  // field on any step would submit the whole form early via the browser's
  // implicit-submit-on-Enter behavior. Only the actual last step submits;
  // everywhere else Enter just advances like clicking Continue (and only if
  // the current step is valid).
  function handleFormSubmit(e: FormEvent) {
    if (!isLastStep) {
      e.preventDefault();
      goNext();
      return;
    }
    handleSubmit(e);
  }

  const isPending = submit.isPending || updateMutation.isPending || saveDraft.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-28">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow-label text-muted-foreground">{editId ? 'Edit a property' : 'List a property'}</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {editId ? 'Update your listing' : 'Publish a listing in minutes'}
            </h1>
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className={`flex gap-1.5 overflow-x-auto pb-1 ${SCROLLBAR_HIDE}`}>
          {STEPS.map((s, index) => {
            const active = index === step;
            const done = index < step;
            const locked = index > maxStepReached;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => goToStep(index)}
                disabled={locked}
                aria-disabled={locked}
                className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'text-primary-foreground'
                    : locked
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : done
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="submitStepPill"
                    className="bg-heading-gradient absolute inset-0 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    active ? 'bg-white/20' : done ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  {done && !active ? <Check className="h-2.5 w-2.5" /> : index + 1}
                </span>
                <span className="relative">{s.label}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardHeader className="space-y-0">
                <p className="eyebrow-label text-muted-foreground">Step {step + 1}</p>
                <CardTitle className="text-xl">{STEPS[step].question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {step === 0 && (
                  <>
                    <FieldRow icon={Check} label="Select Purpose">
                      <div className="flex gap-2">
                        {(['sale', 'rent'] as ListingPurpose[]).map((purpose) => (
                          <motion.button
                            key={purpose}
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => update('purpose', purpose)}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                              form.purpose === purpose
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {purpose === 'sale' ? 'Sell' : 'Rent'}
                          </motion.button>
                        ))}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Building2} label="Select Property Type">
                      <div className="space-y-3">
                        <div className="flex gap-4 border-b border-border">
                          {categories.map((category) => (
                            <button
                              key={category.slug}
                              type="button"
                              onClick={() => setSelectedCategoryTab(category.slug)}
                              className={`pb-2 text-sm font-medium transition-colors ${
                                category.slug === activeCategoryTab
                                  ? 'border-b-2 border-primary text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {category.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {typesInActiveCategory.map((type) => {
                            const TypeIcon = PROPERTY_TYPE_ICONS[type.slug] ?? Home;
                            const active = form.propertyTypeId === type.id;
                            return (
                              <motion.button
                                key={type.id}
                                type="button"
                                disabled={taxonomyLoading}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => update('propertyTypeId', type.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                                  active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-input text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <TypeIcon className="h-3.5 w-3.5" />
                                {type.label}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </FieldRow>
                  </>
                )}

                {step === 1 && (
                  <>
                    <FieldRow icon={Type} label="Title">
                      <Input
                        required
                        placeholder="e.g. Beautiful House in DHA Phase 5"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        className="rounded-full"
                      />
                    </FieldRow>

                    <FieldRow icon={MapPin} label="City">
                      <Select id="city" required value={form.city} onChange={(e) => update('city', e.target.value)} className="rounded-full">
                        <option value="">Select City</option>
                        {PAKISTAN_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </Select>
                    </FieldRow>

                    <FieldRow icon={Compass} label="Location">
                      <PlacesAutocompleteInput
                        required
                        placeholder="Search Location (e.g. Bahria Town)"
                        value={form.area}
                        onChange={(value) => update('area', value)}
                      />
                      {/* No map integration exists anywhere in this codebase — present, flagged, inert. */}
                      <button
                        type="button"
                        disabled
                        className="mt-3 w-full rounded-2xl border border-dashed border-input py-6 text-center text-sm text-muted-foreground opacity-60"
                      >
                        Set Location on Map (coming soon)
                      </button>
                    </FieldRow>

                    <FieldRow icon={ImageIcon} label="Description">
                      <Textarea
                        placeholder="Describe your property, its features, area it is in etc."
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        className="rounded-2xl"
                      />
                    </FieldRow>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FieldRow icon={Ruler} label="Area Size">
                      <div className="flex gap-2">
                        <Input
                          id="areaValue"
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.areaValue}
                          onChange={(e) => update('areaValue', e.target.value)}
                          className="rounded-full"
                        />
                        <Select className="w-28 rounded-full" value={form.areaUnit} onChange={(e) => update('areaUnit', e.target.value as AreaUnit)}>
                          {AREA_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </FieldRow>

                    <FieldRow icon={BedDouble} label="Bedrooms">
                      <div className="flex flex-wrap gap-1.5">
                        {BEDROOM_OPTIONS.map((option) => (
                          <motion.button
                            key={option}
                            type="button"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => update('bedrooms', option)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              form.bedrooms === option
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Bath} label="Bathrooms">
                      <div className="flex flex-wrap gap-1.5">
                        {BATHROOM_OPTIONS.map((option) => (
                          <motion.button
                            key={option}
                            type="button"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => update('bathrooms', option)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              form.bathrooms === option
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    </FieldRow>

                    <FieldRow icon={Building} label="Other Details">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Input
                          placeholder="Year built"
                          type="number"
                          min="0"
                          value={form.yearBuilt}
                          onChange={(e) => update('yearBuilt', e.target.value)}
                          className="rounded-full"
                        />
                        <Input
                          placeholder="Floor/Level"
                          value={form.floorLevel}
                          onChange={(e) => update('floorLevel', e.target.value)}
                          className="rounded-full"
                        />
                        <Select
                          value={form.furnishingStatus}
                          onChange={(e) => update('furnishingStatus', e.target.value as FurnishingStatus)}
                          className="rounded-full"
                        >
                          <option value="">Furnishing…</option>
                          {FURNISHING_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </FieldRow>
                  </>
                )}

                {step === 3 && (
                  <FieldRow icon={ListChecks} label="Feature and Amenities">
                    <div className="space-y-3">
                      {Object.keys(amenitiesByCategory).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Select a property type to see available amenities.</p>
                      ) : (
                        <>
                          {selectedAmenities.size > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <AnimatePresence initial={false}>
                                {Array.from(selectedAmenities.entries()).map(([slug, selection]) => {
                                  const amenity = amenities.find((a) => a.slug === slug);
                                  if (!amenity) return null;
                                  const detail = selection.textValue || (selection.value != null ? String(selection.value) : '');
                                  return (
                                    <motion.span
                                      key={slug}
                                      layout
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.15 }}
                                      className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                                    >
                                      {amenity.label}
                                      {detail && <span className="text-primary/70">: {detail}</span>}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedAmenities((prev) => {
                                            const next = new Map(prev);
                                            next.delete(slug);
                                            return next;
                                          })
                                        }
                                        aria-label={`Remove ${amenity.label}`}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </motion.span>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDraftAmenities(new Map(selectedAmenities));
                              setActiveAmenityTab(Object.keys(amenitiesByCategory)[0]);
                              setAmenitiesModalOpen(true);
                            }}
                          >
                            <ListChecks className="mr-1.5 h-4 w-4" />
                            {selectedAmenities.size > 0 ? 'Edit Amenities' : 'Add Amenities'}
                          </Button>
                        </>
                      )}
                    </div>
                  </FieldRow>
                )}

                {step === 4 && (
                  <MediaUploadField
                    items={mediaItems}
                    coverId={coverId}
                    onFilesSelected={addMediaFiles}
                    onRemove={removeMedia}
                    onSetCover={setCoverId}
                    onMove={moveMedia}
                  />
                )}

                {step === 5 && (
                  <>
                    <FieldRow icon={Tag} label="Price">
                      <div className="flex gap-2">
                        <Input id="price" required type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} className="rounded-full" />
                        <span className="flex h-10 shrink-0 items-center rounded-full border border-input bg-muted px-3 text-sm">PKR</span>
                      </div>
                    </FieldRow>

                    <FieldRow icon={CreditCard} label="Installment Available">
                      <div className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
                        <span className="text-sm text-muted-foreground">Enable if listing is available on installments</span>
                        <Switch checked={form.installmentAvailable} onCheckedChange={(checked) => update('installmentAvailable', checked)} />
                      </div>
                    </FieldRow>

                    <AnimatePresence initial={false}>
                      {form.installmentAvailable && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 rounded-2xl border border-border p-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Advance Amount (PKR)"
                                value={form.advanceAmount}
                                onChange={(e) => update('advanceAmount', e.target.value)}
                                className="rounded-full"
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="No of Installments"
                                value={form.numberOfInstallments}
                                onChange={(e) => update('numberOfInstallments', e.target.value)}
                                className="rounded-full"
                              />
                              <Input
                                type="number"
                                min="0"
                                placeholder="Monthly Installments (PKR)"
                                value={form.monthlyInstallment}
                                onChange={(e) => update('monthlyInstallment', e.target.value)}
                                className="rounded-full"
                              />
                            </div>

                            <div className="space-y-3">
                              <FeeToggleRow
                                label="Balloon Payment Available"
                                checked={form.balloonPaymentAvailable}
                                onCheckedChange={(checked) => update('balloonPaymentAvailable', checked)}
                                amountValue={form.balloonPaymentAmount}
                                onAmountChange={(value) => update('balloonPaymentAmount', value)}
                                amountPlaceholder="Balloon Payment Amount (PKR)"
                              />
                              <FeeToggleRow
                                label="Balloting Fee"
                                checked={form.ballotingFeeApplicable}
                                onCheckedChange={(checked) => update('ballotingFeeApplicable', checked)}
                                amountValue={form.ballotingFeeAmount}
                                onAmountChange={(value) => update('ballotingFeeAmount', value)}
                                amountPlaceholder="Balloting Fee Amount (PKR)"
                              />
                              <FeeToggleRow
                                label="Possession Fee"
                                checked={form.possessionFeeApplicable}
                                onCheckedChange={(checked) => update('possessionFeeApplicable', checked)}
                                amountValue={form.possessionFeeAmount}
                                onAmountChange={(value) => update('possessionFeeAmount', value)}
                                amountPlaceholder="Possession Fee Amount (PKR)"
                              />
                              <FeeToggleRow
                                label="Development Fee"
                                checked={form.developmentFeeApplicable}
                                onCheckedChange={(checked) => update('developmentFeeApplicable', checked)}
                                amountValue={form.developmentFeeAmount}
                                onAmountChange={(value) => update('developmentFeeAmount', value)}
                                amountPlaceholder="Development Fee Amount (PKR)"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <FieldRow icon={CalendarCheck} label="Ready for Possession">
                      <div className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
                        <span className="text-sm text-muted-foreground">Enable if listing is ready for possession</span>
                        <Switch checked={form.readyForPossession} onCheckedChange={(checked) => update('readyForPossession', checked)} />
                      </div>
                    </FieldRow>
                  </>
                )}

                {step === 6 && (
                  <>
                    <FieldRow icon={Mail} label="Email">
                      <Input value={user?.email ?? ''} disabled className="rounded-full bg-muted" />
                    </FieldRow>
                    <FieldRow icon={Smartphone} label="Mobile">
                      <PhoneField
                        value={form.mobile}
                        onChange={(value) => update('mobile', value)}
                        dialCode={form.mobileDialCode}
                        onDialCodeChange={(value) => update('mobileDialCode', value)}
                      />
                    </FieldRow>
                    <FieldRow icon={PhoneCall} label="Landline">
                      <PhoneField
                        value={form.landline}
                        onChange={(value) => update('landline', value)}
                        dialCode={form.landlineDialCode}
                        onDialCodeChange={(value) => update('landlineDialCode', value)}
                      />
                    </FieldRow>
                  </>
                )}

                {step === 7 && (
                  <>
                    {(form.title || form.price) && (
                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-brand-emerald/20 text-primary">
                          <Home className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{form.title || 'Untitled listing'}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[form.area, form.city].filter(Boolean).join(', ') || 'Location not set'}
                          </p>
                          {form.price && <p className="text-sm font-semibold text-primary">PKR {Number(form.price).toLocaleString()}</p>}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Double check the details above — you can go back to any step to make changes before publishing.
                    </p>
                  </>
                )}

                {step === 8 && (
                  <div className="flex flex-col items-center gap-5 py-6 text-center">
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Your listing is ready. Once published it appears instantly on Jayedaad and is reviewed by our verification team.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {!editId && (
                        <Button type="button" variant="outline" disabled={isPending} onClick={handleSaveDraft}>
                          {saveDraft.isPending ? 'Saving…' : 'Save draft'}
                        </Button>
                      )}
                      <Button type="button" variant="secondary" disabled={isPending} onClick={() => setStep(7)}>
                        Preview again
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {submit.isPending || updateMutation.isPending
                          ? editId
                            ? 'Saving…'
                            : 'Publishing…'
                          : editId
                            ? 'Save Changes'
                            : 'Publish property'}
                      </Button>
                    </div>
                    {(submit.isError || updateMutation.isError) && (
                      <p className="text-sm text-destructive">Something went wrong — please try again.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
          <Button type="button" variant="outline" disabled={step === 0 || isPending} onClick={goBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <div className="ml-auto flex items-center gap-3">
            {!editId && !isLastStep && (
              <Button type="button" variant="outline" disabled={isPending} onClick={handleSaveDraft}>
                {saveDraft.isPending ? 'Saving…' : 'Save draft'}
              </Button>
            )}
            {!isLastStep && (
              <Button type="button" disabled={isPending || !currentStepValid} onClick={goNext}>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>

      <AnimatePresence>
        {amenitiesModalOpen && (
          <AmenitiesModal
            amenitiesByCategory={amenitiesByCategory}
            activeTab={activeAmenityTab ?? Object.keys(amenitiesByCategory)[0]}
            onTabChange={setActiveAmenityTab}
            draft={draftAmenities}
            onDraftChange={setDraftAmenities}
            onCancel={() => setAmenitiesModalOpen(false)}
            onCommit={() => {
              setSelectedAmenities(draftAmenities);
              setAmenitiesModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Resizes/re-encodes JPEG/PNG/WEBP to a max 1920px-wide JPEG at 82% quality
// client-side before upload ("Auto-compressed" in the reference) — HEIC and
// video pass through untouched (the Canvas API can't decode/re-encode
// either), so compression is real for the file types that actually support it.
async function compressImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  const maxWidth = 1920;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

function MediaUploadField({
  items,
  coverId,
  onFilesSelected,
  onRemove,
  onSetCover,
  onMove,
}: {
  items: MediaItem[];
  coverId: string | undefined;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files.length) onFilesSelected(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-input'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="font-medium">Drag & drop your best photography</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or HEIC · Up to 30 MB each · Auto-compressed</p>
        <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
          Browse files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {[
            { label: 'Images', active: true },
            { label: 'Videos', active: true },
            { label: '360° tour', active: false },
            { label: 'Floor plans', active: false },
          ].map((chip) => (
            <span
              key={chip.label}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                chip.active ? 'border-border text-muted-foreground' : 'border-input text-muted-foreground/50'
              }`}
              title={chip.active ? undefined : 'Not supported yet'}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview & Reorder</p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const isCover = coverId ? item.id === coverId : index === 0;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                    className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                  >
                    {item.type === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    )}

                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-[10px] font-medium text-destructive">
                        Failed
                      </div>
                    )}

                    {isCover && item.status === 'done' && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>

                    {item.status === 'done' && (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/90 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={() => onMove(item.id, -1)} aria-label="Move left">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => onSetCover(item.id)}
                            className="text-[9px] font-medium text-primary"
                          >
                            Set cover
                          </button>
                        )}
                        <button type="button" onClick={() => onMove(item.id, 1)} aria-label="Move right">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">{label}</p>
        {children}
      </div>
    </div>
  );
}

function FeeToggleRow({
  label,
  checked,
  onCheckedChange,
  amountValue,
  onAmountChange,
  amountPlaceholder,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  amountValue: string;
  onAmountChange: (value: string) => void;
  amountPlaceholder: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
      <AnimatePresence initial={false}>
        {checked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Input type="number" min="0" placeholder={amountPlaceholder} value={amountValue} onChange={(e) => onAmountChange(e.target.value)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PhoneField({
  value,
  onChange,
  dialCode,
  onDialCodeChange,
}: {
  value: string;
  onChange: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <CountryCodeSelect countries={COUNTRIES} value={dialCode} onChange={onDialCodeChange} className="w-[110px] shrink-0" />
      <Input
        type="tel"
        inputMode="numeric"
        placeholder="3XXXXXXXXX"
        value={value}
        maxLength={getMaxPhoneDigits(dialCode)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

// Zameen-style "Feature and Amenities" popup — tabs across the top (one per
// AmenityCategory that actually has amenities for the chosen property type,
// already filtered server-side), a 2-column field grid per tab, Cancel/Add
// Amenities at the bottom. Draft-then-commit: edits only apply to the
// caller's real selection when "Add Amenities" is clicked.
function AmenitiesModal({
  amenitiesByCategory,
  activeTab,
  onTabChange,
  draft,
  onDraftChange,
  onCancel,
  onCommit,
}: {
  amenitiesByCategory: Record<string, Amenity[]>;
  activeTab: string | undefined;
  onTabChange: (tab: string) => void;
  draft: Map<string, AmenitySelection>;
  onDraftChange: (next: Map<string, AmenitySelection>) => void;
  onCancel: () => void;
  onCommit: () => void;
}) {
  const categories = Object.keys(amenitiesByCategory);
  const items = activeTab ? (amenitiesByCategory[activeTab] ?? []) : [];

  function setSelection(slug: string, selection: AmenitySelection | null) {
    const next = new Map(draft);
    if (selection === null) next.delete(slug);
    else next.set(slug, selection);
    onDraftChange(next);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold">Feature and Amenities</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex gap-1 overflow-x-auto border-b border-border px-5 ${SCROLLBAR_HIDE}`}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onTabChange(category)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === category
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {AMENITY_CATEGORY_TAB_LABELS[category] ?? category.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className={`flex-1 overflow-y-auto p-5 ${SCROLLBAR_HIDE}`}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {items.map((amenity) => {
              const selection = draft.get(amenity.slug);
              const selected = draft.has(amenity.slug);
              return (
                <div key={amenity.slug} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{amenity.label}</span>
                  {amenity.valueType === 'boolean' && (
                    <Checkbox
                      checked={selected}
                      onChange={(e) => setSelection(amenity.slug, e.target.checked ? {} : null)}
                    />
                  )}
                  {amenity.valueType === 'number' && (
                    <Input
                      type="number"
                      placeholder={amenity.valueUnit ? `(${amenity.valueUnit})` : undefined}
                      value={selection?.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setSelection(amenity.slug, raw ? { value: Number(raw) } : null);
                      }}
                      className="w-32"
                    />
                  )}
                  {amenity.valueType === 'text' && (
                    <Input
                      type="text"
                      value={selection?.textValue ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setSelection(amenity.slug, raw ? { textValue: raw } : null);
                      }}
                      className="w-40"
                    />
                  )}
                  {amenity.valueType === 'select' && (
                    <Select
                      value={selection?.textValue ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setSelection(amenity.slug, raw ? { textValue: raw } : null);
                      }}
                      className="w-40"
                    >
                      <option value="">Select</option>
                      {(amenity.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              );
            })}
            {items.length === 0 && <p className="text-sm text-muted-foreground">No amenities in this category.</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onCommit}>
            Add Amenities
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}