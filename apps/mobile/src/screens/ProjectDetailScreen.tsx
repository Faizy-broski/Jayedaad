import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  ScrollView,
  Share,
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  StyleSheet,
  Dimensions,
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

const { width } = Dimensions.get('window');
const GALLERY_HEIGHT = 360;
const THUMB_SIZE = 48;

// FIGMA COLORS (Overrides for specific design elements)
const FIGMA_PRIMARY = '#0F5A3E'; // Deep green from the mockup
const FIGMA_SURFACE = '#FFFFFF';
const FIGMA_MUTED_BG = '#F5F7F7';
const FIGMA_BORDER = '#E5E7EB';

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

export function ProjectDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { projectSlug } = route.params;
  const { project, isLoading } = usePublicProjectDetailViewModel(projectSlug);
  const { projects: cityProjects } = useProjectsViewModel(project ? { city: project.city } : {});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryIntent, setEnquiryIntent] = useState<'inquiry' | 'visit'>('inquiry');

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

  function openEnquiry(intent: 'inquiry' | 'visit') {
    setEnquiryIntent(intent);
    setEnquiryOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Gallery project={project} onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          {/* HEADER */}
          <View style={styles.badgeRow}>
            {project.verificationStatus === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
              </View>
            )}
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{STATUS_LABELS[project.status].toUpperCase()}</Text>
            </View>
            {project.verificationStatus !== 'verified' && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{VERIFICATION_LABELS[project.verificationStatus].toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{project.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.location}>
              {project.area}, {project.city}
            </Text>
          </View>

          {price && <Text style={styles.price}>{price}</Text>}
          
          {project.possessionDate && (
            <View style={styles.possessionRow}>
              <Ionicons name="flag-outline" size={14} color={theme.colors.muted} />
              <Text style={styles.possessionText}>Possession: {formatPossessionDate(project.possessionDate)}</Text>
            </View>
          )}

          {/* ABOUT THIS PROJECT */}
          {project.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description} numberOfLines={descriptionExpanded ? undefined : 4}>
                {project.description}
              </Text>
              <Pressable onPress={() => setDescriptionExpanded((v) => !v)} style={{ marginTop: 4 }}>
                <Text style={styles.link}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
              </Pressable>
            </View>
          )}

          {/* UNIT TYPES (Vertical Stack without Carousel) */}
          {!!project.unitTypes?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Unit Types</Text>
              <View style={styles.cardListVertical}>
                {project.unitTypes.map((unit) => (
                  <View key={unit.id} style={styles.unitCardVertical}>
                    <View style={styles.unitCardHeader}>
                      <Text style={styles.statLabel}>{unit.label}</Text>
                      {(unit.priceMin || unit.priceMax) && (
                        <Text style={styles.unitPrice}>
                          {unit.priceMin && unit.priceMax && unit.priceMin !== unit.priceMax
                            ? `${formatPrice(Number(unit.priceMin))} – ${formatPrice(Number(unit.priceMax))}`
                            : formatPrice(Number(unit.priceMin ?? unit.priceMax))}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.unitCardFooter}>
                      <View style={styles.statRow}>
                        {unit.bedrooms != null && (
                          <View style={styles.statItem}>
                            <Ionicons name="bed-outline" size={16} color={FIGMA_PRIMARY} />
                            <Text style={styles.statItemText}>{unit.bedrooms} Beds</Text>
                          </View>
                        )}
                        {unit.bathrooms != null && (
                          <View style={styles.statItem}>
                            <Ionicons name="water-outline" size={16} color={FIGMA_PRIMARY} />
                            <Text style={styles.statItemText}>{unit.bathrooms} Baths</Text>
                          </View>
                        )}
                      </View>

                      {(unit.areaValueMin || unit.areaValueMax) && (
                        <Text style={styles.statAreaText}>
                          <Ionicons name="scan-outline" size={12} color={theme.colors.muted} />{' '}
                          {unit.areaValueMin && unit.areaValueMax && unit.areaValueMin !== unit.areaValueMax
                            ? `${unit.areaValueMin}–${unit.areaValueMax} ${unit.areaUnit}`
                            : `${unit.areaValueMin ?? unit.areaValueMax} ${unit.areaUnit}`}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* PAYMENT PLANS (Colorful & Creative Aesthetic) */}
          {!!project.paymentPlans?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Plans</Text>
              <View style={styles.cardList}>
                {project.paymentPlans.map((plan) => {
                  const rows: { label: string; value: string }[] = [];
                  if (plan.bookingPercent != null) rows.push({ label: 'Booking Amount', value: `${plan.bookingPercent}%` });
                  if (plan.installmentCount != null) rows.push({ label: 'Number of Installments', value: String(plan.installmentCount) });
                  if (plan.installmentFrequency) rows.push({ label: 'Installment Frequency', value: humanizeCategory(plan.installmentFrequency) });
                  if (plan.balloonPaymentCount != null) rows.push({ label: 'Balloon Payments', value: String(plan.balloonPaymentCount) });

                  return (
                    <View key={plan.id} style={styles.planTableWrap}>
                      <View style={styles.planTableHeader}>
                        <Text style={styles.planTableHeaderText}>{plan.label}</Text>
                      </View>
                      {rows.map((row, i) => (
                        <View key={row.label} style={[styles.planTableRow, i % 2 === 1 && styles.planTableRowAlt]}>
                          <Text style={styles.financingLabel}>{row.label}</Text>
                          <Text style={styles.financingValue}>{row.value}</Text>
                        </View>
                      ))}
                      {(plan.description || plan.planDocumentUrl) && (
                        <View style={styles.planTableFooter}>
                          {plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
                          {plan.planDocumentUrl && (
                            <Pressable
                              style={styles.docButton}
                              onPress={() => Linking.openURL(plan.planDocumentUrl!).catch(() => {})}
                            >
                              <Ionicons name="document-text-outline" size={14} color={FIGMA_PRIMARY} />
                              <Text style={styles.docButtonText}>View Plan Document</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* AMENITIES */}
          {Object.keys(amenitiesByCategory).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              {Object.entries(amenitiesByCategory).map(([category, items]) => (
                <Accordion key={category} label={humanizeCategory(category)} defaultOpen={category === 'main_features'}>
                  <View style={styles.amenityChecklist}>
                    {items.map((a) => (
                      <View key={a.slug} style={styles.amenityPill}>
                        <Ionicons name="checkmark" size={16} color={FIGMA_PRIMARY} />
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
                  <Pressable key={url} style={styles.docButtonSolid} onPress={() => Linking.openURL(url).catch(() => {})}>
                    <Ionicons name="images-outline" size={14} color={FIGMA_PRIMARY} />
                    <Text style={styles.docButtonText}>Floor Plan {project.floorPlanUrls.length > 1 ? i + 1 : ''}</Text>
                  </Pressable>
                ))}
                {project.brochureUrl && (
                  <Pressable style={styles.docButtonSolid} onPress={() => Linking.openURL(project.brochureUrl!).catch(() => {})}>
                    <Ionicons name="document-attach-outline" size={14} color={FIGMA_PRIMARY} />
                    <Text style={styles.docButtonText}>Brochure</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* DEVELOPER / LISTED BY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listed by</Text>
            <View style={styles.developerCard}>
              {project.developer.logoUrl ? (
                <Image source={{ uri: project.developer.logoUrl }} style={styles.developerLogo} />
              ) : (
                <View style={styles.developerLogoPlaceholder}>
                  <Text style={styles.developerLogoPlaceholderText}>{project.developer.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.developerInfo}>
                <Text style={styles.developerName}>{project.developer.name}</Text>
                <Text style={styles.developerSubtitle}>Developer</Text>
              </View>
              <DeveloperContactIcons developer={project.developer} onMessagePress={() => openEnquiry('inquiry')} />
            </View>
          </View>

          <EnquiryDialog
            visible={enquiryOpen}
            onClose={() => setEnquiryOpen(false)}
            projectName={project.name}
            intent={enquiryIntent}
          />

          {/* MORE PROJECTS IN THIS CITY */}
          {moreInCity.length > 0 && (
            <View style={[styles.section, { paddingBottom: 20 }]}>
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              <Text style={styles.sectionSubtitle}>Based on your saved searches</Text>
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

      {/* STICKY FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerBtn, styles.footerContactBtn]}
          onPress={() => project.developer.phone && Linking.openURL(`tel:${project.developer.phone}`)}
          disabled={!project.developer.phone}
        >
          <Ionicons name="call-outline" size={18} color={theme.colors.text} />
          <Text style={styles.footerContactText}>Contact</Text>
        </Pressable>
        <Pressable 
          style={[styles.footerBtn, styles.footerVisitBtn]} 
          onPress={() => openEnquiry('visit')}
        >
          <Ionicons name="calendar-outline" size={18} color={FIGMA_SURFACE} />
          <Text style={styles.footerVisitText}>Book a visit</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Gallery({ project, onBack }: { project: Project; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const images = [project.coverImageUrl, ...project.galleryImageUrls].filter((u): u is string => !!u);
  const items: Array<{ url: string; type: 'image' | 'video' }> = [
    ...images.map((url) => ({ url, type: 'image' as const })),
    ...(project.videoUrl ? [{ url: project.videoUrl, type: 'video' as const }] : []),
  ];

  async function handleShare() {
    try {
      await Share.share({
        message: `${project.name} — ${[project.area, project.city].filter(Boolean).join(', ')}`,
      });
    } catch {
      // Ignore
    }
  }

  if (items.length === 0) {
    return (
      <View style={[styles.galleryEmpty, { height: GALLERY_HEIGHT }]}>
        <Ionicons name="business-outline" size={40} color={theme.colors.mutedLight} />
        {/* Top actions fallback */}
        <View style={styles.galleryTopNav}>
          <Pressable style={styles.topActionButton} onPress={onBack}><Ionicons name="chevron-back" size={20} color="#000" /></Pressable>
        </View>
      </View>
    );
  }

  const active = items[index];

  return (
    <View style={{ position: 'relative' }}>
      {active.type === 'video' ? (
        <Pressable
          style={[styles.galleryHero, styles.galleryVideo, { height: GALLERY_HEIGHT }]}
          onPress={() => Linking.openURL(active.url).catch(() => {})}
        >
          <Ionicons name="play-circle" size={56} color="#ffffff" />
        </Pressable>
      ) : (
        <Image source={{ uri: active.url }} style={[styles.galleryHero, { height: GALLERY_HEIGHT }]} />
      )}
      
      {/* Gradient overlay for better top/bottom legibility */}
      <View style={styles.galleryGradient} pointerEvents="none" />

      {/* TOP ACTIONS */}
      <View style={styles.galleryTopNav}>
        <Pressable style={styles.topActionButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={styles.galleryTopRight}>
          <Pressable style={styles.topActionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={theme.colors.text} />
          </Pressable>
          <Pressable style={styles.topActionButton}>
            <Ionicons name="heart-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      {/* BOTTOM THUMBNAILS */}
      {items.length > 1 && (
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbStrip}
          contentContainerStyle={styles.thumbStripContent}
          renderItem={({ item, index: i }) => (
            <Pressable onPress={() => setIndex(i)}>
              {item.type === 'video' ? (
                <View style={[styles.thumb, styles.galleryVideo, i === index && styles.thumbActive]}>
                  <Ionicons name="play" size={16} color="#ffffff" />
                </View>
              ) : (
                <Image source={{ uri: item.url }} style={[styles.thumb, i === index && styles.thumbActive]} />
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function DeveloperContactIcons({
  developer,
  onMessagePress,
}: {
  developer: Project['developer'];
  onMessagePress: () => void;
}) {
  return (
    <View style={styles.iconRow}>
      <Pressable style={[styles.contactCircleBtn, { backgroundColor: FIGMA_MUTED_BG, borderColor: FIGMA_BORDER, borderWidth: 1 }]} onPress={onMessagePress}>
        <Ionicons name="chatbubble-outline" size={18} color={theme.colors.text} />
      </Pressable>
      {developer.phone && (
        <Pressable style={[styles.contactCircleBtn, { backgroundColor: FIGMA_PRIMARY }]} onPress={() => Linking.openURL(`tel:${developer.phone}`)}>
          <Ionicons name="call" size={18} color={FIGMA_SURFACE} />
        </Pressable>
      )}
      {developer.whatsapp && (
        <Pressable
          style={[styles.contactCircleBtn, { backgroundColor: '#25D366' }]}
          onPress={() => Linking.openURL(`https://wa.me/${developer.whatsapp!.replace(/\D/g, '')}`)}
        >
          <Ionicons name="logo-whatsapp" size={18} color={FIGMA_SURFACE} />
        </Pressable>
      )}
    </View>
  );
}

function SimilarCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const price = priceRangeLabel(project);
  return (
    <Pressable style={styles.similarCard} onPress={onPress}>
      <View style={styles.similarImageWrap}>
        {project.coverImageUrl ? (
          <Image source={{ uri: project.coverImageUrl }} style={styles.similarImage} />
        ) : (
          <View style={[styles.similarImage, styles.galleryEmpty]}>
            <Ionicons name="business-outline" size={24} color={theme.colors.mutedLight} />
          </View>
        )}
        {project.verificationStatus === 'verified' && (
          <View style={styles.similarVerifiedBadge}>
            <Text style={styles.similarVerifiedText}>VERIFIED</Text>
          </View>
        )}
        <View style={styles.similarHeartBadge}>
          <Ionicons name="heart-outline" size={14} color={theme.colors.text} />
        </View>
        {price && (
          <View style={styles.similarPriceOverlay}>
            <Text style={styles.similarPriceOverlayText}>{price}</Text>
          </View>
        )}
      </View>
      <View style={styles.similarBody}>
        <Text style={styles.similarTitle} numberOfLines={1}>{project.name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={theme.colors.muted} />
          <Text style={styles.similarSubtitle} numberOfLines={1}>{project.city}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function EnquiryDialog({
  visible,
  onClose,
  projectName,
  intent,
}: {
  visible: boolean;
  onClose: () => void;
  projectName: string;
  intent: 'inquiry' | 'visit';
}) {
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
    setMessage(
      intent === 'visit'
        ? `I would like to book a visit to see ${projectName}. Please let me know your available times.`
        : `I'm interested in ${projectName}. Please share more details.`,
    );
  }, [visible, user, projectName, intent]);

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
      showToast(intent === 'visit' ? 'Visit request sent.' : 'Enquiry sent.');
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={visible} onClose={onClose} title={intent === 'visit' ? 'Book a Visit' : 'Send Enquiry'}>
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
  root: { flex: 1, backgroundColor: FIGMA_SURFACE },
  scrollContent: { paddingBottom: 100 }, 
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: FIGMA_SURFACE },
  muted: { fontSize: 14, color: theme.colors.mutedLight },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },

  galleryEmpty: { backgroundColor: FIGMA_MUTED_BG, alignItems: 'center', justifyContent: 'center' },
  galleryHero: { width: '100%', resizeMode: 'cover' },
  galleryVideo: { backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
  galleryGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  
  galleryTopNav: {
    position: 'absolute',
    top: 50, // Accounts for status bar approx
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  galleryTopRight: { flexDirection: 'row', gap: 10 },
  topActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FIGMA_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  
  thumbStrip: { position: 'absolute', left: 16, bottom: 20 },
  thumbStripContent: { gap: 10 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  thumbActive: { borderColor: FIGMA_SURFACE },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' },
  verifiedBadge: {
    backgroundColor: FIGMA_PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', color: FIGMA_SURFACE, letterSpacing: 0.5 },
  pillBadge: { backgroundColor: FIGMA_MUTED_BG, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  pillBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.text, letterSpacing: 0.5 },

  title: { fontSize: 24, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { fontSize: 14, color: theme.colors.muted },
  price: { fontSize: 28, fontWeight: '900', color: FIGMA_PRIMARY, marginTop: 12 },
  possessionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  possessionText: { fontSize: 13, color: theme.colors.muted },

  section: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: theme.colors.muted, marginTop: -8, marginBottom: 8 },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 22 },
  link: { fontSize: 13, fontWeight: '700', color: FIGMA_PRIMARY },

  // Updated Vertical Unit Cards (No Carousel)
  cardListVertical: { gap: 12 },
  unitCardVertical: {
    backgroundColor: FIGMA_SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  unitCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  unitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  statLabel: { fontSize: 15, fontWeight: '800', color: theme.colors.text, flex: 1, paddingRight: 10 },
  statRow: { flexDirection: 'row', gap: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statItemText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  statAreaText: { fontSize: 13, color: theme.colors.muted },
  unitPrice: { fontSize: 15, fontWeight: '900', color: FIGMA_PRIMARY },

  cardList: { gap: 12 },
  // Payment Plan rendered as a real table: a primary-colored "thead" bar
  // (the plan's own label, e.g. "Cash / On Possession") with alternating
  // light-primary-tinted row stripes below, rather than a plain label+grid.
  planTableWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: FIGMA_SURFACE,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  planTableHeader: {
    backgroundColor: FIGMA_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  planTableHeaderText: { fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2 },
  planTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  planTableRowAlt: { backgroundColor: 'rgba(15,90,62,0.06)' },
  planTableFooter: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FIGMA_BORDER,
  },
  planDescription: { fontSize: 13, color: '#475569', lineHeight: 18 },
  financingLabel: { fontSize: 13, color: '#475569' },
  financingValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },

  // Figma Pill Amenities
  amenityChecklist: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  amenityPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    width: '48%', 
    backgroundColor: FIGMA_MUTED_BG, 
    borderRadius: 999, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  amenityText: { fontSize: 13, fontWeight: '600', color: theme.colors.text, flexShrink: 1 },

  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docButtonSolid: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: FIGMA_MUTED_BG, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  docButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  
  // Custom Plan Doc Button matching the plan card styling
  docButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1E6DD', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },

  // Developer Card
  developerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FIGMA_SURFACE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: FIGMA_BORDER,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  developerLogo: { width: 52, height: 52, borderRadius: 26 },
  developerLogoPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: FIGMA_PRIMARY, alignItems: 'center', justifyContent: 'center' },
  developerLogoPlaceholderText: { fontSize: 20, fontWeight: '800', color: FIGMA_SURFACE },
  developerInfo: { flex: 1, marginLeft: 12 },
  developerName: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  developerSubtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  iconRow: { flexDirection: 'row', gap: 8 },
  contactCircleBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  enquiryForm: { gap: 16 },
  enquiryLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  enquiryPhoneRow: { flexDirection: 'row', gap: 10 },
  enquiryPhoneInput: {
    flex: 1, borderWidth: 1, borderColor: FIGMA_BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.colors.text,
  },

  // Similar Projects Cards
  similarList: { gap: 16 },
  similarCard: { width: width * 0.65 },
  similarImageWrap: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  similarImage: { width: '100%', height: 160 },
  similarVerifiedBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: FIGMA_PRIMARY, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  similarVerifiedText: { fontSize: 9, fontWeight: '800', color: FIGMA_SURFACE, letterSpacing: 0.5 },
  similarHeartBadge: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: FIGMA_SURFACE, alignItems: 'center', justifyContent: 'center' },
  similarPriceOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  similarPriceOverlayText: { fontSize: 16, fontWeight: '900', color: FIGMA_SURFACE, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  similarBody: { paddingTop: 12, gap: 4 },
  similarTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  similarSubtitle: { fontSize: 13, color: theme.colors.muted },

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
    paddingBottom: 32, // Accommodates safe area
    backgroundColor: FIGMA_SURFACE,
    borderTopWidth: 1,
    borderTopColor: FIGMA_BORDER,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
  },
  footerContactBtn: { backgroundColor: FIGMA_MUTED_BG, borderWidth: 1, borderColor: FIGMA_BORDER },
  footerContactText: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },
  footerVisitBtn: { backgroundColor: FIGMA_PRIMARY },
  footerVisitText: { color: FIGMA_SURFACE, fontWeight: '800', fontSize: 15 },
});