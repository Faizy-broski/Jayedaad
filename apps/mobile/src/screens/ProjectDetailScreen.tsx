import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  PanResponder,
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
  getMaxPhoneDigits,
  contactRepository,
  Project,
  ProjectStatus,
  ProjectVerificationStatus,
  useAuthViewModel,
  useFormattedPrice,
  usePublicProjectDetailViewModel,
  useProjectsViewModel,
} from '@jayedaad/core';
import { BackButton, Button, CountryCodeField, Dialog, TextInput as UiTextInput, theme, useToast } from '@jayedaad/ui-native';
import { ProjectFavoriteButton } from '../components/ListingContactActions';
import type { RootStackParamList } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');
// Was 360 — shrunk to match ListingDetailScreen.tsx's identical density
// pass, leaving more room for badges/price/stats above the fold.
const GALLERY_HEIGHT = 300;
const THUMB_SIZE = 48;

// FIGMA COLORS
const FIGMA_PRIMARY = '#0F5A3E';
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

function priceRangeLabel(project: Project, format: (amount: number) => string): string | null {
  if (!project.priceRange) return null;
  const { min, max } = project.priceRange;
  if (min === max) return format(min);
  return `${format(min)} – ${format(max)}`;
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
  // Was an inline numberOfLines toggle (Read more/less expanded in place) —
  // now opens a real bottom sheet with the full title + description, same
  // "Title and Description" slide-up sheet as ListingDetailScreen.tsx.
  const [descriptionSheetOpen, setDescriptionSheetOpen] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  // Modal's own built-in animationType can't be driven by a gesture, so
  // this sheet manages its own slide (animationType="none" below) —
  // Animated.Value for translateY, PanResponder on a drag handle for
  // swipe-to-dismiss, backdrop Pressable for tap-to-dismiss. Mirrors
  // ListingDetailScreen.tsx's identical sheet exactly.
  const descriptionSheetY = useRef(new Animated.Value(600)).current;
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryIntent, setEnquiryIntent] = useState<'inquiry' | 'visit'>('inquiry');
  const { format } = useFormattedPrice();

  useEffect(() => {
    if (!descriptionSheetOpen) return;
    Animated.timing(descriptionSheetY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [descriptionSheetOpen, descriptionSheetY]);

  function closeDescriptionSheet() {
    Animated.timing(descriptionSheetY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() =>
      setDescriptionSheetOpen(false),
    );
  }

  const descriptionSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) descriptionSheetY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120 || gesture.vy > 0.8) {
          closeDescriptionSheet();
        } else {
          Animated.spring(descriptionSheetY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  if (isLoading || !project) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const price = priceRangeLabel(project, format);
  const moreInCity = cityProjects.filter((p) => p.id !== project.id);

  function openEnquiry(intent: 'inquiry' | 'visit') {
    setEnquiryIntent(intent);
    setEnquiryOpen(true);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <Gallery project={project} onBack={() => navigation.goBack()} />

        {/* TOP SECTION WITH BACKGROUND IMAGE */}
        <ImageBackground
          source={require('../../assets/images/feature-bg.webp')}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <View style={styles.headerContent}>
            {/* HEADER BADGES */}
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
          </View>
        </ImageBackground>

        {/* REST OF CONTENT */}
        <View style={styles.contentBody}>
          {/* ABOUT THIS PROJECT */}
          {project.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description} numberOfLines={4}>
                {project.description}
              </Text>
              <Pressable onPress={() => setDescriptionSheetOpen(true)} style={{ marginTop: 4 }}>
                <Text style={styles.link}>Read more</Text>
              </Pressable>
            </View>
          )}

          {/* UNIT TYPES - Updated to Figma soft-shadow aesthetic */}
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
                            ? `${format(Number(unit.priceMin))} – ${format(Number(unit.priceMax))}`
                            : format(Number(unit.priceMin ?? unit.priceMax))}
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

          {/* PAYMENT PLANS */}
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

          {/* AMENITIES — capped to 6 until "See more", same expand pattern
              as ListingDetailScreen.tsx's Amenities section (there capped
              to 4 — projects' amenity cards are denser/2-column, so 6
              fills roughly the same visual height before the toggle). */}
          {!!project.amenities?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityChecklist}>
                {(amenitiesExpanded ? project.amenities : project.amenities.slice(0, 6)).map((a) => (
                  <View key={a.slug} style={styles.amenityRow}>
                    <Ionicons name="checkmark" size={16} color={FIGMA_PRIMARY} />
                    <Text style={styles.amenityText}>{a.label}</Text>
                  </View>
                ))}
              </View>
              {project.amenities.length > 6 && (
                <Pressable onPress={() => setAmenitiesExpanded((v) => !v)} style={{ marginTop: 4, alignSelf: 'center' }}>
                  <Text style={styles.link}>
                    {amenitiesExpanded ? 'See less' : `See ${project.amenities.length - 6} more`}
                  </Text>
                </Pressable>
              )}
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
              <DeveloperContactIcons developer={project.developer} />
            </View>
          </View>

          <EnquiryDialog
            visible={enquiryOpen}
            onClose={() => setEnquiryOpen(false)}
            projectName={project.name}
            intent={enquiryIntent}
          />

          {/* TITLE AND DESCRIPTION — full-screen slide-up sheet, not an
              inline expand. Closable by the X button, tapping the dimmed
              backdrop, or swiping the handle down. Mirrors
              ListingDetailScreen.tsx's identical sheet. */}
          <Modal
            visible={descriptionSheetOpen}
            animationType="none"
            transparent
            onRequestClose={closeDescriptionSheet}
          >
            <View style={styles.descriptionSheetBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeDescriptionSheet} />
              <Animated.View style={[styles.descriptionSheet, { transform: [{ translateY: descriptionSheetY }] }]}>
                <View {...descriptionSheetPanResponder.panHandlers}>
                  <View style={styles.descriptionSheetHandle} />
                  <View style={styles.descriptionSheetHeader}>
                    <Text style={styles.descriptionSheetHeaderTitle}>Title and Description</Text>
                    <Pressable onPress={closeDescriptionSheet} hitSlop={8}>
                      <Ionicons name="close" size={24} color={theme.colors.text} />
                    </Pressable>
                  </View>
                </View>
                <ScrollView contentContainerStyle={styles.descriptionSheetBody}>
                  <Text style={styles.descriptionSheetTitle}>{project.name}</Text>
                  <Text style={styles.description}>{project.description}</Text>
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>

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
  // Drives both directions of sync, same as ListingDetailScreen.tsx's
  // identical gallery: swiping the hero updates the active thumbnail
  // (onMomentumScrollEnd below), tapping a thumbnail scrolls the hero to
  // match (heroListRef.scrollToOffset in the thumbnail's onPress).
  const heroListRef = useRef<FlatList>(null);
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
          <BackButton onPress={onBack} size={40} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Swipeable hero — was a single static Image only ever changed by
          tapping a thumbnail below; now a real horizontally-paged
          FlatList, one photo/video per full-width page, same treatment as
          ListingDetailScreen.tsx's identical gallery. */}
      <FlatList
        ref={heroListRef}
        data={items}
        keyExtractor={(item, i) => `hero-${item.url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) =>
          item.type === 'video' ? (
            <Pressable
              style={[styles.galleryHero, styles.galleryVideo, { width, height: GALLERY_HEIGHT }]}
              onPress={() => Linking.openURL(item.url).catch(() => {})}
            >
              <Ionicons name="play-circle" size={56} color="#ffffff" />
            </Pressable>
          ) : (
            <Image source={{ uri: item.url }} style={[styles.galleryHero, { width, height: GALLERY_HEIGHT }]} />
          )
        }
      />

      {/* Gradient overlay for better top/bottom legibility */}
      <View style={styles.galleryGradient} pointerEvents="none" />

      {/* TOP ACTIONS */}
      <View style={styles.galleryTopNav}>
        <BackButton onPress={onBack} size={40} />
        <View style={styles.galleryTopRight}>
          <Pressable style={styles.topActionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={theme.colors.text} />
          </Pressable>
          <ProjectFavoriteButton project={project} size={20} style={styles.topActionButton} />
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
            <Pressable
              onPress={() => {
                setIndex(i);
                heroListRef.current?.scrollToOffset({ offset: i * width, animated: true });
              }}
            >
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

// Was Message/Call/WhatsApp (chatbubble-outline "message" icon opened the
// in-app enquiry form, no SMS at all) — now Call/WhatsApp/SMS, same paper-
// plane "send" icon ContactIconActions.tsx uses on the listing side, so
// the two contact rows read identically across properties and projects.
function DeveloperContactIcons({ developer }: { developer: Project['developer'] }) {
  return (
    <View style={styles.iconRow}>
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
      {developer.phone && (
        <Pressable
          style={[styles.contactCircleBtn, { backgroundColor: FIGMA_MUTED_BG, borderColor: FIGMA_BORDER, borderWidth: 1 }]}
          onPress={() => Linking.openURL(`sms:${developer.phone}`)}
        >
          <Ionicons name="paper-plane-outline" size={18} color={theme.colors.text} />
        </Pressable>
      )}
    </View>
  );
}

function SimilarCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const { format } = useFormattedPrice();
  const price = priceRangeLabel(project, format);
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

  // Updated Header Setup for Background Image
  headerBackground: {
    width: '100%',
    backgroundColor: FIGMA_SURFACE, 
  },
  headerBackgroundImage: {
    opacity: 0.05, // Subtle watermark for maximum readability
    resizeMode: 'cover',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    // `gap` alone spaces badgeRow/title/locationRow/price/possessionRow —
    // was 8 plus each child's own marginTop stacked on top of it, same
    // double-spacing fix as ListingDetailScreen.tsx's identical header.
    gap: 4,
  },
  contentBody: {
    paddingHorizontal: 20,
    gap: 8,
  },

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
    top: 50, 
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

  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: theme.colors.muted },
  // Softened from '900' — same typography pass as ListingDetailScreen's
  // price, which was reported as excessively bold.
  price: { fontSize: 26, fontWeight: '600', color: FIGMA_PRIMARY, marginTop: 4 },
  possessionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  possessionText: { fontSize: 13, color: theme.colors.muted },

  section: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: theme.colors.muted, marginTop: -8, marginBottom: 8 },
  description: { fontSize: 14, color: theme.colors.muted, lineHeight: 22 },
  link: { fontSize: 13, fontWeight: '700', color: FIGMA_PRIMARY },

  // "Title and Description" sheet — mirrors ListingDetailScreen.tsx's
  // identical styles exactly.
  descriptionSheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  descriptionSheet: {
    maxHeight: '85%',
    backgroundColor: FIGMA_SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  descriptionSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: FIGMA_BORDER,
    marginTop: 10,
  },
  descriptionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FIGMA_BORDER,
  },
  descriptionSheetHeaderTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  descriptionSheetBody: { padding: 20, gap: 16, paddingBottom: 32 },
  descriptionSheetTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text },

  // Updated Vertical Unit Cards
  cardListVertical: { gap: 12 },
  unitCardVertical: {
    backgroundColor: FIGMA_SURFACE,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
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

  amenityChecklist: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 12 },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    borderRadius: 16,
    backgroundColor: FIGMA_SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
  },
  amenityText: { fontSize: 12, fontWeight: '700', color: FIGMA_PRIMARY, flexShrink: 1 },

  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docButtonSolid: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: FIGMA_MUTED_BG, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
  },
  docButtonText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  
  docButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1E6DD', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },

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