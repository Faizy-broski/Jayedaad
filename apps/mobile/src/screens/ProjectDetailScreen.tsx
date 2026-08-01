import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  COUNTRIES,
  formatPrice,
  getMaxPhoneDigits,
  contactRepository,
  Project,
  ProjectStatus,
  ProjectVerificationStatus,
  useAuthViewModel,
  usePublicProjectDetailViewModel,
  useProjectsViewModel,
} from '@jayedaad/core';
import { Accordion, Button, CountryCodeField, Dialog, TextInput as UiTextInput, theme, useToast } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = 240;

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  under_construction: 'Under Construction',
  ready: 'Ready',
  draft: 'Draft',
};

const VERIFICATION_LABELS: Record<ProjectVerificationStatus, string> = {
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  draft: 'Draft',
};

function humanizeCategory(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function priceRangeLabel(project: Project): string | null {
  if (!project.priceRange) return null;
  const { min, max } = project.priceRange;
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

function formatPossessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Real counterpart to the (agent)/projects/[id] view — that page uses the
// auth-gated findById endpoint (agent/super_admin only), which a public
// buyer can't call. This screen uses usePublicProjectDetailViewModel
// (findBySlug, @Public()) instead, and renders every real Project field:
// unit types, payment plans, amenities grouped by category, and a real
// developer contact card (Call/WhatsApp straight from developer.phone/
// whatsapp) plus an Email enquiry that posts to the existing public
// Contact Us endpoint (contactRepository.submit) — no project-scoped leads
// table exists yet, so this intentionally doesn't fake a trackable CRM lead.
export function ProjectDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { projectSlug } = route.params;
  const { project, isLoading } = usePublicProjectDetailViewModel(projectSlug);
  const { projects: cityProjects } = useProjectsViewModel(project ? { city: project.city } : {});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  if (isLoading || !project) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const price = priceRangeLabel(project);
  const amenitiesByCategory = (project.amenities ?? []).reduce<Record<string, NonNullable<Project['amenities']>>>(
    (acc, a) => {
      (acc[a.category] ??= []).push(a);
      return acc;
    },
    {},
  );
  const moreInCity = cityProjects.filter((p) => p.id !== project.id);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Gallery project={project} />

      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.badgeRow}>
          {project.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.primary} />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          )}
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{STATUS_LABELS[project.status]}</Text>
          </View>
          {project.verificationStatus !== 'verified' && (
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{VERIFICATION_LABELS[project.verificationStatus]}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={13} color={theme.colors.muted} /> {project.area}, {project.city}
        </Text>

        {price && <Text style={styles.price}>{price}</Text>}
        {project.possessionDate && (
          <View style={styles.possessionRow}>
            <Ionicons name="flag-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.possessionText}>Possession: {formatPossessionDate(project.possessionDate)}</Text>
          </View>
        )}

        {/* DESCRIPTION */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Project</Text>
            <Text style={styles.description} numberOfLines={descriptionExpanded ? undefined : 4}>
              {project.description}
            </Text>
            <Pressable onPress={() => setDescriptionExpanded((v) => !v)}>
              <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
            </Pressable>
          </View>
        )}

        {/* UNIT TYPES */}
        {!!project.unitTypes?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit Types</Text>
            <View style={styles.cardList}>
              {project.unitTypes.map((unit) => (
                <View key={unit.id} style={styles.unitCard}>
                  <View style={styles.unitCardHeader}>
                    <Text style={styles.unitLabel}>{unit.label}</Text>
                    {unit.propertyType?.label && <Text style={styles.unitPropertyType}>{unit.propertyType.label}</Text>}
                  </View>
                  <View style={styles.unitStatsRow}>
                    {(unit.areaValueMin || unit.areaValueMax) && (
                      <Text style={styles.unitStat}>
                        {unit.areaValueMin && unit.areaValueMax && unit.areaValueMin !== unit.areaValueMax
                          ? `${unit.areaValueMin}–${unit.areaValueMax} ${unit.areaUnit}`
                          : `${unit.areaValueMin ?? unit.areaValueMax} ${unit.areaUnit}`}
                      </Text>
                    )}
                    {unit.bedrooms != null && <Text style={styles.unitStat}>{unit.bedrooms} Bed</Text>}
                    {unit.bathrooms != null && <Text style={styles.unitStat}>{unit.bathrooms} Bath</Text>}
                  </View>
                  {(unit.priceMin || unit.priceMax) && (
                    <Text style={styles.unitPrice}>
                      {unit.priceMin && unit.priceMax && unit.priceMin !== unit.priceMax
                        ? `${formatPrice(Number(unit.priceMin))} – ${formatPrice(Number(unit.priceMax))}`
                        : formatPrice(Number(unit.priceMin ?? unit.priceMax))}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PAYMENT PLANS */}
        {!!project.paymentPlans?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Plans</Text>
            <View style={styles.cardList}>
              {project.paymentPlans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <View style={styles.financingGrid}>
                    {plan.bookingPercent != null && <FinancingRow label="Booking Amount" value={`${plan.bookingPercent}%`} />}
                    {plan.installmentCount != null && <FinancingRow label="Number of Installments" value={String(plan.installmentCount)} />}
                    {plan.installmentFrequency && <FinancingRow label="Installment Frequency" value={humanizeCategory(plan.installmentFrequency)} />}
                    {plan.balloonPaymentCount != null && <FinancingRow label="Balloon Payments" value={String(plan.balloonPaymentCount)} />}
                  </View>
                  {plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
                  {plan.planDocumentUrl && (
                    <Pressable style={styles.docButton} onPress={() => Linking.openURL(plan.planDocumentUrl!).catch(() => {})}>
                      <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.docButtonText}>View Plan Document</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AMENITIES — grouped by category */}
        {Object.keys(amenitiesByCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            {Object.entries(amenitiesByCategory).map(([category, items]) => (
              <Accordion key={category} label={humanizeCategory(category)} defaultOpen={category === 'main_features'}>
                <View style={styles.amenityGrid}>
                  {items.map((a) => (
                    <View key={a.slug} style={styles.amenityChip}>
                      <Ionicons name="checkmark" size={12} color={theme.colors.primary} />
                      <Text style={styles.amenityText}>{a.label}</Text>
                    </View>
                  ))}
                </View>
              </Accordion>
            ))}
          </View>
        )}

        {/* FLOOR PLANS / BROCHURE */}
        {(!!project.floorPlanUrls?.length || project.brochureUrl) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <View style={styles.docRow}>
              {project.floorPlanUrls.map((url, i) => (
                <Pressable key={url} style={styles.docButton} onPress={() => Linking.openURL(url).catch(() => {})}>
                  <Ionicons name="images-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.docButtonText}>Floor Plan {project.floorPlanUrls.length > 1 ? i + 1 : ''}</Text>
                </Pressable>
              ))}
              {project.brochureUrl && (
                <Pressable style={styles.docButton} onPress={() => Linking.openURL(project.brochureUrl!).catch(() => {})}>
                  <Ionicons name="document-attach-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.docButtonText}>Brochure</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* DEVELOPER / CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <View style={styles.developerCard}>
            {project.developer.logoUrl ? (
              <Image source={{ uri: project.developer.logoUrl }} style={styles.developerLogo} />
            ) : (
              <View style={styles.developerLogoPlaceholder}>
                <Text style={styles.developerLogoPlaceholderText}>{project.developer.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.developerName}>{project.developer.name}</Text>
          </View>
          <DeveloperContactActions developer={project.developer} />
          <Pressable style={styles.emailButton} onPress={() => setEnquiryOpen(true)}>
            <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.emailButtonText}>Email</Text>
          </Pressable>
        </View>

        <EnquiryDialog visible={enquiryOpen} onClose={() => setEnquiryOpen(false)} projectName={project.name} />

        {/* MORE PROJECTS IN THIS CITY */}
        {moreInCity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More Projects in {project.city}</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={moreInCity}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => (
                <SimilarCard project={item} onPress={() => navigation.push('ProjectDetail', { projectSlug: item.slug })} />
              )}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Gallery({ project }: { project: Project }) {
  const [index, setIndex] = useState(0);
  const images = [project.coverImageUrl, ...project.galleryImageUrls].filter((u): u is string => !!u);
  const items: Array<{ url: string; type: 'image' | 'video' }> = [
    ...images.map((url) => ({ url, type: 'image' as const })),
    ...(project.videoUrl ? [{ url: project.videoUrl, type: 'video' as const }] : []),
  ];

  if (items.length === 0) {
    return (
      <View style={[styles.galleryEmpty, { height: GALLERY_HEIGHT }]}>
        <Ionicons name="business-outline" size={40} color={theme.colors.mutedLight} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item }) =>
          item.type === 'video' ? (
            <Pressable style={[styles.galleryItem, styles.galleryVideo]} onPress={() => Linking.openURL(item.url).catch(() => {})}>
              <Ionicons name="play-circle" size={56} color="#ffffff" />
            </Pressable>
          ) : (
            <Image source={{ uri: item.url }} style={styles.galleryItem} />
          )
        }
      />
      {items.length > 1 && (
        <View style={styles.galleryDots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.galleryDot, i === index && styles.galleryDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function FinancingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.financingRow}>
      <Text style={styles.financingLabel}>{label}</Text>
      <Text style={styles.financingValue}>{value}</Text>
    </View>
  );
}

// Project has no contactNumbers array (unlike Listing) — Call/WhatsApp come
// directly from DeveloperSummary.phone/whatsapp instead.
function DeveloperContactActions({ developer }: { developer: Project['developer'] }) {
  if (!developer.phone && !developer.whatsapp) return null;

  return (
    <View style={styles.contactRow}>
      {developer.phone && (
        <Pressable style={styles.contactButtonPrimary} onPress={() => Linking.openURL(`tel:${developer.phone}`)}>
          <Text style={styles.contactButtonPrimaryText}>Call</Text>
        </Pressable>
      )}
      {developer.whatsapp && (
        <Pressable
          style={styles.contactButton}
          onPress={() => Linking.openURL(`https://wa.me/${developer.whatsapp!.replace(/\D/g, '')}`)}
        >
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </Pressable>
      )}
    </View>
  );
}

function SimilarCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const price = priceRangeLabel(project);
  return (
    <Pressable style={styles.similarCard} onPress={onPress}>
      {project.coverImageUrl ? (
        <Image source={{ uri: project.coverImageUrl }} style={styles.similarImage} />
      ) : (
        <View style={[styles.similarImage, styles.galleryEmpty]}>
          <Ionicons name="business-outline" size={24} color={theme.colors.mutedLight} />
        </View>
      )}
      <View style={styles.similarBody}>
        <Text style={styles.similarTitle} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.similarSubtitle} numberOfLines={1}>{project.area}, {project.city}</Text>
        {price && <Text style={styles.similarPrice}>{price}</Text>}
      </View>
    </Pressable>
  );
}

// Real, working, previously-uncalled endpoint (POST /contact, @Public()) —
// not a trackable/assignable CRM lead like listings' EnquiryDialog (there's
// no project_id column on `leads` and no inbox to consume one), just an
// honest generic message with the project name in the subject.
function EnquiryDialog({ visible, onClose, projectName }: { visible: boolean; onClose: () => void; projectName: string }) {
  const { user } = useAuthViewModel();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('92');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName((user?.user_metadata?.display_name as string | undefined) ?? '');
    setEmail(user?.email ?? '');
    setMessage(`I'm interested in ${projectName}. Please share more details.`);
  }, [visible, user, projectName]);

  async function handleSend() {
    if (!name || !email || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await contactRepository.submit({
        name,
        email,
        phone: phone ? `+${dialCode.replace(/\D/g, '')}${phone}` : undefined,
        subject: projectName,
        message,
      });
      showToast('Enquiry sent.');
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={visible} onClose={onClose} title="Send Enquiry">
      <View style={styles.enquiryForm}>
        <UiTextInput label="Name" value={name} onChangeText={setName} />
        <UiTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <View>
          <Text style={styles.enquiryLabel}>Phone (optional)</Text>
          <View style={styles.enquiryPhoneRow}>
            <CountryCodeField countries={COUNTRIES} value={dialCode} onChange={setDialCode} />
            <RNTextInput
              style={styles.enquiryPhoneInput}
              value={phone}
              maxLength={getMaxPhoneDigits(dialCode)}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
              keyboardType="number-pad"
              placeholder="3XXXXXXXXX"
              placeholderTextColor={theme.colors.mutedLight}
            />
          </View>
        </View>
        <UiTextInput label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={4} />
        <Button label={submitting ? 'Sending…' : 'Send'} onPress={handleSend} disabled={submitting} />
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg },
  muted: { fontSize: 14, color: theme.colors.mutedLight },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },

  galleryEmpty: { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  galleryItem: { width: SCREEN_WIDTH, height: GALLERY_HEIGHT },
  galleryVideo: { backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  galleryDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: theme.spacing.sm },
  galleryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  galleryDotActive: { backgroundColor: theme.colors.primary, width: 16 },

  badgeRow: { flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  pillBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.muted },

  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  location: { fontSize: 13, color: theme.colors.muted },
  price: { fontSize: 24, fontWeight: '800', color: theme.colors.primary, marginTop: 4 },
  possessionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  possessionText: { fontSize: 13, color: theme.colors.muted },

  section: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },

  cardList: { gap: theme.spacing.sm },
  unitCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 6,
  },
  unitCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  unitPropertyType: { fontSize: 11, color: theme.colors.muted, fontWeight: '600' },
  unitStatsRow: { flexDirection: 'row', gap: theme.spacing.md },
  unitStat: { fontSize: 12, color: theme.colors.muted },
  unitPrice: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },

  planCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  planLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  planDescription: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },

  financingGrid: { gap: 6 },
  financingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  financingLabel: { fontSize: 13, color: theme.colors.muted },
  financingValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amenityText: { fontSize: 12, color: theme.colors.text, fontWeight: '600' },

  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  docButtonText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },

  developerCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  developerLogo: { width: 48, height: 48, borderRadius: 24 },
  developerLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developerLogoPlaceholderText: { fontSize: 18, fontWeight: '700', color: theme.colors.mutedLight },
  developerName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },

  contactRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  contactButtonPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonPrimaryText: { color: theme.colors.bg, fontWeight: '700', fontSize: 14 },
  contactButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  emailButtonText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },

  enquiryForm: { gap: theme.spacing.md },
  enquiryLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
  enquiryPhoneRow: { flexDirection: 'row', gap: theme.spacing.sm },
  enquiryPhoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
  },

  similarList: { gap: theme.spacing.md },
  similarCard: { width: 160 },
  similarImage: { width: 160, height: 110, borderRadius: theme.radius.md },
  similarBody: { paddingTop: 6, gap: 2 },
  similarTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  similarSubtitle: { fontSize: 11, color: theme.colors.muted },
  similarPrice: { fontSize: 13, fontWeight: '800', color: theme.colors.primary },
});
