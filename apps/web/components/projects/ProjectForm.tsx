'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AreaUnit,
  COUNTRIES,
  CreateDeveloperInput,
  CreateProjectPaymentPlanInput,
  CreateProjectUnitTypeInput,
  PAKISTAN_CITIES,
  ProjectStatus,
  getMaxPhoneDigits,
  projectsRepository,
  useDevelopersViewModel,
  useManageProjectsViewModel,
  useProjectDetailViewModel,
  useTaxonomyViewModel,
} from '@jayedaad/core';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CountryCodeSelect,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
} from '@jayedaad/ui-web';
import {
  Building,
  Calendar,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Loader2,
  LucideIcon,
  MapPin,
  Percent,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];
const PROJECT_STATUSES: ProjectStatus[] = ['planned', 'under_construction', 'ready'];

const EMPTY_UNIT_TYPE: CreateProjectUnitTypeInput = {
  label: '',
  propertyTypeSlug: '',
  areaUnit: 'marla',
};

const EMPTY_PAYMENT_PLAN: CreateProjectPaymentPlanInput = {
  label: '',
};

const EMPTY_DEVELOPER: CreateDeveloperInput = { name: '', slug: '', description: '', phone: '', whatsapp: '', city: '' };

// Upload-on-select { id, previewUrl, status, url, kind } items, same
// pattern as apps/web/app/(agent)/submit/page.tsx's mediaItems — but each
// media slot here (cover/gallery/floor plans/brochure) is tracked
// separately since they map to distinct CreateProjectInput fields, not one
// shared array. `file` is only present for a freshly-picked upload; a slot
// built from an already-saved project (edit/view mode, see slotFromUrl)
// only ever has a url/previewUrl, never a File object.
interface MediaSlot {
  id: string;
  name: string;
  kind: 'image' | 'document';
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  file?: File;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function slotFromUrl(url: string): MediaSlot {
  const name = url.split('/').pop() ?? url;
  const kind = name.toLowerCase().endsWith('.pdf') ? 'document' : 'image';
  return { id: crypto.randomUUID(), name, kind, previewUrl: url, status: 'done', url };
}

// Same icon-badge + label + control layout as FieldRow in
// apps/web/app/(agent)/submit/page.tsx, reused here for visual consistency
// with the rest of the agent-facing forms.
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

function UploadButton({
  icon: Icon,
  label,
  accept,
  multiple,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  accept: string;
  multiple?: boolean;
  onSelect: (files: FileList) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary">
      <Icon className="h-4 w-4" />
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onSelect(e.target.files);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function MediaChip({ slot, onRemove, readOnly }: { slot: MediaSlot; onRemove: () => void; readOnly?: boolean }) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      {slot.kind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slot.previewUrl} alt={slot.name} className="h-full w-full object-cover" />
      ) : (
        <FileText className="h-6 w-6 text-muted-foreground" />
      )}
      {slot.status === 'uploading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      {slot.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 text-[10px] font-medium text-destructive">
          Failed
        </div>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${slot.name}`}
          className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Shared between the Super Admin (/admin/projects/new, /admin/projects/[id])
// and agent-portal (/projects/new, /projects/[id]) routes — both roles are
// allowed to create projects per
// services/api/src/projects/projects.controller.ts's @Roles('agent',
// 'super_admin'), so this form is parameterized rather than duplicated per
// route group / mode:
//   - create: no projectId, editable, submits POST /projects.
//   - edit: projectId set, editable, submits PATCH /projects/:id
//     (super_admin-only route — only reached via /admin/projects/[id]).
//   - view: projectId set, readOnly=true — reached via the agent-portal's
//     /projects/[id], since agents can view but never edit/delete a project
//     (see ProjectsListView.tsx's role gate on those actions).
export function ProjectForm({
  successHref,
  projectId,
  readOnly = false,
}: {
  successHref: string;
  projectId?: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { developers, create: createDeveloper } = useDevelopersViewModel();
  const { propertyTypes, amenities } = useTaxonomyViewModel();
  const { create, update } = useManageProjectsViewModel();
  const { project, isLoading: projectLoading } = useProjectDetailViewModel(projectId);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [developerId, setDeveloperId] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [possessionDate, setPossessionDate] = useState('');

  const [cover, setCover] = useState<MediaSlot | null>(null);
  const [gallery, setGallery] = useState<MediaSlot[]>([]);
  const [floorPlans, setFloorPlans] = useState<MediaSlot[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [brochure, setBrochure] = useState<MediaSlot | null>(null);

  const [unitTypes, setUnitTypes] = useState<CreateProjectUnitTypeInput[]>([{ ...EMPTY_UNIT_TYPE }]);
  // UI-only — CreateProjectUnitTypeInput has no category field, only
  // propertyTypeSlug (which already resolves to a category via the FK). This
  // parallel array just drives which Property Type options are shown per row
  // so the dropdown isn't one flat list of every Homes/Plots/Commercial type.
  const [unitTypeCategorySlugs, setUnitTypeCategorySlugs] = useState<string[]>(['']);
  const [paymentPlans, setPaymentPlans] = useState<CreateProjectPaymentPlanInput[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [developerModalOpen, setDeveloperModalOpen] = useState(false);
  const [developerForm, setDeveloperForm] = useState<CreateDeveloperInput>(EMPTY_DEVELOPER);
  const [developerPhoneDialCode, setDeveloperPhoneDialCode] = useState('92');

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
    setStatus(project.status);
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
    setSelectedAmenities(new Set((project.amenities ?? []).map((a) => a.slug)));
  }, [project]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleCreateDeveloper() {
    if (!developerForm.name || !developerForm.slug) {
      toast.error('Name and slug are required.');
      return;
    }
    try {
      const developer = await createDeveloper.mutateAsync({
        ...developerForm,
        phone: developerForm.phone ? `+${developerPhoneDialCode.replace(/\D/g, '')}${developerForm.phone}` : undefined,
      });
      toast.success('Developer added.');
      setDeveloperId(developer.id);
      setDeveloperModalOpen(false);
      setDeveloperForm(EMPTY_DEVELOPER);
      setDeveloperPhoneDialCode('92');
    } catch {
      toast.error('Something went wrong — please try again.');
    }
  }

  async function uploadSingle(file: File, set: (slot: MediaSlot | null) => void) {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    const kind = file.type.startsWith('image/') ? 'image' : 'document';
    set({ id, name: file.name, kind, file, previewUrl, status: 'uploading' });
    try {
      const { url } = await projectsRepository.uploadMedia(file);
      set({ id, name: file.name, kind, file, previewUrl, status: 'done', url });
    } catch {
      set({ id, name: file.name, kind, file, previewUrl, status: 'error' });
      toast.error('Upload failed — please try again.');
    }
  }

  async function uploadMany(files: FileList, set: React.Dispatch<React.SetStateAction<MediaSlot[]>>) {
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const kind = file.type.startsWith('image/') ? 'image' : 'document';
      set((prev) => [...prev, { id, name: file.name, kind, file, previewUrl, status: 'uploading' }]);
      try {
        const { url } = await projectsRepository.uploadMedia(file);
        set((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'done', url } : m)));
      } catch {
        set((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'error' } : m)));
        toast.error('Upload failed — please try again.');
      }
    }
  }

  function updateUnitType(index: number, patch: Partial<CreateProjectUnitTypeInput>) {
    setUnitTypes((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  function updateUnitTypeCategory(index: number, categorySlug: string) {
    setUnitTypeCategorySlugs((prev) => prev.map((c, i) => (i === index ? categorySlug : c)));
    // Old propertyTypeSlug almost certainly doesn't belong to the new category.
    updateUnitType(index, { propertyTypeSlug: '' });
  }

  function addUnitType() {
    setUnitTypes((prev) => [...prev, { ...EMPTY_UNIT_TYPE }]);
    setUnitTypeCategorySlugs((prev) => [...prev, '']);
  }

  function removeUnitType(index: number) {
    setUnitTypes((prev) => prev.filter((_, i) => i !== index));
    setUnitTypeCategorySlugs((prev) => prev.filter((_, i) => i !== index));
  }

  const unitTypeCategories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, type) => {
    if (type.category && !acc.some((c) => c.slug === type.category.slug)) acc.push(type.category);
    return acc;
  }, []);

  function updatePaymentPlan(index: number, patch: Partial<CreateProjectPaymentPlanInput>) {
    setPaymentPlans((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function toggleAmenity(slug: string) {
    if (readOnly) return;
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const amenitiesByCategory = amenities.reduce<Record<string, typeof amenities>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

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
      amenitySlugs: Array.from(selectedAmenities),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (!name || !slug || !developerId || !city || !area) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const input = buildInput();
      if (projectId) {
        await update.mutateAsync({ id: projectId, input });
        toast.success('Project updated.');
      } else {
        await create.mutateAsync(input);
        toast.success('Project created.');
      }
      router.push(successHref);
    } catch {
      toast.error('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Drafts are create-only, same as listings' Save as Draft — an existing
  // project already has a real status, so there's nothing to "draft" once
  // it's been through handleSubmit at least once.
  async function handleSaveDraft() {
    if (readOnly || projectId) return;
    if (!name || !slug || !developerId || !city || !area) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSavingDraft(true);
    try {
      await create.mutateAsync({ ...buildInput(), status: 'draft' });
      toast.success('Draft saved.');
      router.push(successHref);
    } catch {
      toast.error('Something went wrong — please try again.');
    } finally {
      setSavingDraft(false);
    }
  }

  if (projectId && projectLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const heading = projectId ? (readOnly ? 'View Project' : 'Edit Project') : 'New Project';

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-muted-foreground">
          {readOnly
            ? 'Read-only — you don’t have permission to edit this project.'
            : 'List a new development, same way it appears on Zameen New Projects.'}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Building className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow icon={Sparkles} label="Project Name">
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Swiss Mall Gulberg"
              required
              disabled={readOnly}
            />
          </FieldRow>

          <FieldRow icon={Layers} label="URL Slug">
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="e.g. swiss-mall-gulberg"
              required
              disabled={readOnly}
            />
          </FieldRow>

          <FieldRow icon={Building} label="Developer">
            <div className="flex gap-2">
              <Select value={developerId} onChange={(e) => setDeveloperId(e.target.value)} required className="flex-1" disabled={readOnly}>
                <option value="">Select a developer…</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              {!readOnly && (
                <Button type="button" variant="outline" onClick={() => setDeveloperModalOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> New
                </Button>
              )}
            </div>
          </FieldRow>

          <FieldRow icon={MapPin} label="City">
            <Select value={city} onChange={(e) => setCity(e.target.value)} required disabled={readOnly}>
              <option value="">Select City</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FieldRow>

          <FieldRow icon={MapPin} label="Area / Locality">
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Gulberg" required disabled={readOnly} />
          </FieldRow>

          <FieldRow icon={ListChecks} label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} disabled={readOnly}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </FieldRow>

          <FieldRow icon={Calendar} label="Possession Date">
            <Input type="date" value={possessionDate} onChange={(e) => setPossessionDate(e.target.value)} disabled={readOnly} />
          </FieldRow>

          <FieldRow icon={FileText} label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={readOnly} />
          </FieldRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ImageIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow icon={ImageIcon} label="Cover Image">
            {cover ? (
              <div className="flex items-center gap-3">
                <MediaChip slot={cover} onRemove={() => setCover(null)} readOnly={readOnly} />
                {cover.status === 'error' && <span className="text-xs text-destructive">Upload failed.</span>}
              </div>
            ) : readOnly ? (
              <p className="text-xs text-muted-foreground">No cover image.</p>
            ) : (
              <UploadButton icon={Upload} label="Choose cover image" accept="image/*" onSelect={(f) => uploadSingle(f[0], setCover)} />
            )}
          </FieldRow>

          <FieldRow icon={ImageIcon} label="Gallery Images">
            <div className="space-y-3">
              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {gallery.map((m) => (
                    <MediaChip
                      key={m.id}
                      slot={m}
                      onRemove={() => setGallery((prev) => prev.filter((g) => g.id !== m.id))}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}
              {!readOnly && (
                <UploadButton
                  icon={Upload}
                  label="Add gallery images"
                  accept="image/*"
                  multiple
                  onSelect={(f) => uploadMany(f, setGallery)}
                />
              )}
              {readOnly && gallery.length === 0 && <p className="text-xs text-muted-foreground">No gallery images.</p>}
            </div>
          </FieldRow>

          <FieldRow icon={Layers} label="Floor Plans">
            <div className="space-y-3">
              {floorPlans.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {floorPlans.map((m) => (
                    <MediaChip
                      key={m.id}
                      slot={m}
                      onRemove={() => setFloorPlans((prev) => prev.filter((g) => g.id !== m.id))}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}
              {!readOnly && (
                <UploadButton
                  icon={Upload}
                  label="Add floor plan images"
                  accept="image/*"
                  multiple
                  onSelect={(f) => uploadMany(f, setFloorPlans)}
                />
              )}
              {readOnly && floorPlans.length === 0 && <p className="text-xs text-muted-foreground">No floor plans.</p>}
            </div>
          </FieldRow>

          <FieldRow icon={Film} label="Video / 3D Walkthrough URL">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" disabled={readOnly} />
          </FieldRow>

          <FieldRow icon={FileText} label="Brochure (PDF)">
            {brochure ? (
              <div className="flex items-center gap-3">
                <MediaChip slot={brochure} onRemove={() => setBrochure(null)} readOnly={readOnly} />
                {brochure.status === 'error' && <span className="text-xs text-destructive">Upload failed.</span>}
              </div>
            ) : readOnly ? (
              <p className="text-xs text-muted-foreground">No brochure.</p>
            ) : (
              <UploadButton
                icon={Upload}
                label="Choose brochure PDF"
                accept="application/pdf"
                onSelect={(f) => uploadSingle(f[0], setBrochure)}
              />
            )}
          </FieldRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Layers className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Unit Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitTypes.map((u, index) => (
            <div key={index} className="space-y-3 rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Unit Type {index + 1}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeUnitType(index)}
                    className="text-destructive"
                    aria-label="Remove unit type"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Input
                    value={u.label}
                    onChange={(e) => updateUnitType(index, { label: e.target.value })}
                    placeholder="e.g. 2 Bed Apartment"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={unitTypeCategorySlugs[index] ?? ''}
                    onChange={(e) => updateUnitTypeCategory(index, e.target.value)}
                    disabled={readOnly}
                  >
                    <option value="">Select…</option>
                    {unitTypeCategories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Property Type</Label>
                  <Select
                    value={u.propertyTypeSlug}
                    onChange={(e) => updateUnitType(index, { propertyTypeSlug: e.target.value })}
                    disabled={readOnly || !unitTypeCategorySlugs[index]}
                  >
                    <option value="">Select…</option>
                    {propertyTypes
                      .filter((pt) => pt.category?.slug === unitTypeCategorySlugs[index])
                      .map((pt) => (
                        <option key={pt.slug} value={pt.slug}>
                          {pt.label}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Area Min</Label>
                  <Input
                    type="number"
                    value={u.areaValueMin ?? ''}
                    onChange={(e) => updateUnitType(index, { areaValueMin: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Area Max</Label>
                  <Input
                    type="number"
                    value={u.areaValueMax ?? ''}
                    onChange={(e) => updateUnitType(index, { areaValueMax: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Area Unit</Label>
                  <Select value={u.areaUnit} onChange={(e) => updateUnitType(index, { areaUnit: e.target.value as AreaUnit })} disabled={readOnly}>
                    {AREA_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>Price Min</Label>
                  <Input
                    type="number"
                    value={u.priceMin ?? ''}
                    onChange={(e) => updateUnitType(index, { priceMin: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Price Max</Label>
                  <Input
                    type="number"
                    value={u.priceMax ?? ''}
                    onChange={(e) => updateUnitType(index, { priceMax: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={u.bedrooms ?? ''}
                    onChange={(e) => updateUnitType(index, { bedrooms: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    value={u.bathrooms ?? ''}
                    onChange={(e) => updateUnitType(index, { bathrooms: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" onClick={addUnitType}>
              <Plus className="mr-1 h-4 w-4" /> Add Unit Type
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Percent className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Payment Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentPlans.map((p, index) => (
            <div key={index} className="space-y-3 rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Plan {index + 1}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setPaymentPlans((prev) => prev.filter((_, i) => i !== index))}
                    className="text-destructive"
                    aria-label="Remove payment plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={p.label}
                  onChange={(e) => updatePaymentPlan(index, { label: e.target.value })}
                  placeholder="e.g. 3-Year Easy Installments"
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Booking %</Label>
                  <Input
                    type="number"
                    value={p.bookingPercent ?? ''}
                    onChange={(e) => updatePaymentPlan(index, { bookingPercent: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Installment Count</Label>
                  <Input
                    type="number"
                    value={p.installmentCount ?? ''}
                    onChange={(e) => updatePaymentPlan(index, { installmentCount: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Input
                    value={p.installmentFrequency ?? ''}
                    onChange={(e) => updatePaymentPlan(index, { installmentFrequency: e.target.value })}
                    placeholder="e.g. Quarterly"
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Balloon Payment Count</Label>
                  <Input
                    type="number"
                    value={p.balloonPaymentCount ?? ''}
                    onChange={(e) =>
                      updatePaymentPlan(index, { balloonPaymentCount: e.target.value ? Number(e.target.value) : undefined })
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan Document</Label>
                  {readOnly ? (
                    <p className="text-xs text-muted-foreground">{p.planDocumentUrl ? p.planDocumentUrl.split('/').pop() : 'None.'}</p>
                  ) : (
                    <UploadButton
                      icon={Upload}
                      label={p.planDocumentUrl ? 'Replace document' : 'Upload PDF'}
                      accept="application/pdf"
                      onSelect={async (files) => {
                        try {
                          const { url } = await projectsRepository.uploadMedia(files[0]);
                          updatePaymentPlan(index, { planDocumentUrl: url });
                          toast.success('Document uploaded.');
                        } catch {
                          toast.error('Upload failed — please try again.');
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={p.description ?? ''}
                  onChange={(e) => updatePaymentPlan(index, { description: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" onClick={() => setPaymentPlans((prev) => [...prev, { ...EMPTY_PAYMENT_PLAN }])}>
              <Plus className="mr-1 h-4 w-4" /> Add Payment Plan
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <ListChecks className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(amenitiesByCategory).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <p className="text-sm font-medium capitalize text-muted-foreground">{category.replace('_', ' ')}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((a) => (
                  <button
                    key={a.slug}
                    type="button"
                    onClick={() => toggleAmenity(a.slug)}
                    disabled={readOnly}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedAmenities.has(a.slug)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input text-muted-foreground hover:bg-muted'
                    } ${readOnly ? 'cursor-default' : ''}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(amenitiesByCategory).length === 0 && (
            <p className="text-sm text-muted-foreground">No amenities configured yet.</p>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex gap-3">
          {!projectId && (
            <Button type="button" variant="outline" disabled={submitting || savingDraft} onClick={handleSaveDraft}>
              {savingDraft ? 'Saving…' : 'Save as Draft'}
            </Button>
          )}
          <Button type="submit" disabled={submitting || savingDraft}>
            {submitting ? 'Saving…' : projectId ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      )}

      <Modal open={developerModalOpen} onClose={() => setDeveloperModalOpen(false)} title="New Developer">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={developerForm.name}
              onChange={(e) => {
                const value = e.target.value;
                setDeveloperForm((prev) => ({ ...prev, name: value, slug: slugify(value) }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={developerForm.slug} onChange={(e) => setDeveloperForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select value={developerForm.city} onChange={(e) => setDeveloperForm((prev) => ({ ...prev, city: e.target.value }))}>
              <option value="">Select City</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <div className="flex items-center gap-2">
              <CountryCodeSelect
                countries={COUNTRIES}
                value={developerPhoneDialCode}
                onChange={setDeveloperPhoneDialCode}
                className="w-[110px] shrink-0"
              />
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3XXXXXXXXX"
                value={developerForm.phone}
                maxLength={getMaxPhoneDigits(developerPhoneDialCode)}
                onChange={(e) =>
                  setDeveloperForm((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(developerPhoneDialCode)),
                  }))
                }
                className="min-w-0 flex-1"
              />
            </div>
          </div>
          <Button type="button" onClick={handleCreateDeveloper} disabled={createDeveloper.isPending}>
            {createDeveloper.isPending ? 'Adding…' : 'Add Developer'}
          </Button>
        </div>
      </Modal>
    </form>
  );
}
