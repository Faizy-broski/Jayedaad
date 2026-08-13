import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { formatPrice, PropertyType, useListingSearchViewModel, useTaxonomyViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { AREA_UNITS, BATH_OPTIONS, BED_OPTIONS, DEFAULT_SEARCH_FILTERS, SearchFilterState, toListingSearchFilters } from '../lib/searchFilters';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput';
import { CityPickerModal } from './CityPickerModal';

export interface SearchFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: SearchFilterState;
  onApply: (next: SearchFilterState) => void;
}

// Icon per property type slug (supabase/migrations/0005_taxonomy_seed.sql)
// — reuses the same Ionicons already chosen for these exact types on
// HomeScreen's category tiles (house/flat/residential_plot/office/shop/
// farm_house), extended to cover every other seeded type. 'home-outline'
// fallback for any future type added server-side before this map is updated.
const PROPERTY_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  house: 'home-outline',
  upper_portion: 'layers-outline',
  lower_portion: 'layers-outline',
  farm_house: 'leaf-outline',
  penthouse: 'business-outline',
  flat: 'business-outline',
  room: 'bed-outline',
  residential_plot: 'flag-outline',
  agricultural_land: 'earth-outline',
  plot_file: 'document-text-outline',
  commercial_plot: 'flag-outline',
  industrial_land: 'construct-outline',
  plot_form: 'reader-outline',
  office: 'briefcase-outline',
  warehouse: 'cube-outline',
  building: 'business-outline',
  shop: 'storefront-outline',
  factory: 'construct-outline',
  other: 'ellipsis-horizontal-outline',
};

// Full-screen slide-up Modal (RN has no bottom-sheet primitive in this repo
// — same hand-rolled Modal+Animated approach as PickerField/SideDrawer,
// rather than pulling in a gesture-handler/reanimated-based library).
// Section layout (icon + label, divider, settings-style City row, category-
// tabbed icon chips for Property Type) mirrors Zameen's real filter screen —
// draft-then-commit, same pattern as AddFeaturesScreen: edits apply only
// when "Show Results" is pressed, not live per-keystroke.
export function SearchFilterSheet({ visible, onClose, value, onApply }: SearchFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<SearchFilterState>(value);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [priceSliderWidth, setPriceSliderWidth] = useState(0);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  // Categories in seeded sort order (Homes/Plots/Commercial), deduped from
  // the flat propertyTypes list — same reduce pattern as apps/web's
  // BrowseByCategorySection.tsx, since there's no standalone
  // GET /taxonomy/property-type-categories consumer on mobile yet.
  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, t) => {
    if (t.category && !acc.some((c) => c.slug === t.category.slug)) acc.push(t.category);
    return acc;
  }, []);

  useEffect(() => {
    if (!visible || categories.length === 0) return;
    const selectedCategory = propertyTypes.find((t) => t.slug === draft.propertyTypeSlug)?.category.slug;
    setActiveCategorySlug(selectedCategory ?? categories[0].slug);
    // Only re-derive when the sheet opens — activeCategorySlug is otherwise
    // freely user-driven while the sheet stays open (tapping a tab shouldn't
    // get overridden by this effect re-running from an unrelated draft edit).
  }, [visible]);

  // Live result count for the "Show {count} results" footer button — a
  // real query against the same filters the user is currently editing, not
  // a fake/static label.
  const { total } = useListingSearchViewModel(toListingSearchFilters(draft));

  function set<K extends keyof SearchFilterState>(key: K, val: SearchFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  // Homes (residential) gets Price, Area, Beds, Baths. Plots and Commercial
  // only get Price + Area — no bedroom/bathroom counts, per the categories
  // seeded server-side (supabase/migrations/0005_taxonomy_seed.sql). "Any
  // Type" (no selection) falls back to showing Beds/Baths too, same as
  // before a specific category narrows things down.
  const selectedCategorySlug = propertyTypes.find((t) => t.slug === draft.propertyTypeSlug)?.category.slug;
  const showBedsAndBaths = selectedCategorySlug !== 'plot' && selectedCategorySlug !== 'commercial';

  const typesInActiveCategory = propertyTypes.filter((t: PropertyType) => t.category.slug === activeCategorySlug);

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_SEARCH_FILTERS);
  }

  const minPriceLabel = draft.minPrice ? formatPrice(Number(draft.minPrice)) : 'Any';
  const maxPriceLabel = draft.maxPrice ? formatPrice(Number(draft.maxPrice)) : 'Any';
  // Fixed 0-15 Cr reference range for the draggable budget slider — PKR
  // real-estate listings realistically top out well under this, so it
  // covers the practical range in fixed 1-Lac (100,000) steps. Dragging the
  // left thumb to 0 or the right thumb to the ceiling clears that bound
  // back to "Any" (matches the TextInput's own empty-string = Any
  // convention) rather than sending a literal 0/150,000,000 filter.
  const BUDGET_SCALE_MAX = 150_000_000;
  const BUDGET_STEP = 100_000;
  const sliderMinValue = draft.minPrice ? Math.min(Number(draft.minPrice), BUDGET_SCALE_MAX) : 0;
  const sliderMaxValue = draft.maxPrice ? Math.min(Number(draft.maxPrice), BUDGET_SCALE_MAX) : BUDGET_SCALE_MAX;

  function handlePriceSliderChange([min, max]: number[]) {
    set('minPrice', min > 0 ? String(min) : '');
    set('maxPrice', max < BUDGET_SCALE_MAX ? String(max) : '');
  }

  function handlePriceSliderLayout(e: LayoutChangeEvent) {
    setPriceSliderWidth(e.nativeEvent.layout.width);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.headerIconButton}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.headerIconButton}>
            <Text style={styles.headerDone}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
              <Text style={styles.sectionLabel}>I want to</Text>
              <View style={styles.segmentedControl}>
                {(['sale', 'rent'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => set('purpose', p)}
                    style={[styles.segment, draft.purpose === p && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, draft.purpose === p && styles.segmentTextActive]}>
                      {p === 'sale' ? 'Buy' : 'Rent'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable style={[styles.section, styles.settingsRow]} onPress={() => setCityPickerVisible(true)}>
            <Ionicons name="location-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
            <View style={styles.settingsRowBody}>
              <Text style={styles.sectionLabel}>City</Text>
              <Text style={styles.settingsRowValue}>{draft.city || 'Any City'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="map-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
              <Text style={styles.sectionLabel}>Select Locations</Text>
            </View>
            <PlacesAutocompleteInput placeholder="Search location" value={draft.area} onChange={(v) => set('area', v)} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="business-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
              <Text style={styles.sectionLabel}>Property Types</Text>
            </View>
            <View style={styles.categoryTabRow}>
              {categories.map((c) => {
                const active = c.slug === activeCategorySlug;
                return (
                  <Pressable
                    key={c.slug}
                    onPress={() => setActiveCategorySlug(c.slug)}
                    style={[styles.categoryTab, active && styles.categoryTabActive]}
                  >
                    <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Pressable
                onPress={() => set('propertyTypeSlug', '')}
                style={[styles.chip, !draft.propertyTypeSlug && styles.chipActive]}
              >
                <Ionicons
                  name={!draft.propertyTypeSlug ? 'checkmark-circle' : 'apps-outline'}
                  size={15}
                  color={!draft.propertyTypeSlug ? theme.colors.primary : theme.colors.muted}
                />
                <Text style={[styles.chipText, !draft.propertyTypeSlug && styles.chipTextActive]}>All</Text>
              </Pressable>
              {typesInActiveCategory.map((pt) => {
                const active = draft.propertyTypeSlug === pt.slug;
                return (
                  <Pressable
                    key={pt.slug}
                    onPress={() => set('propertyTypeSlug', pt.slug)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Ionicons
                      name={PROPERTY_TYPE_ICONS[pt.slug] ?? 'home-outline'}
                      size={15}
                      color={active ? theme.colors.primary : theme.colors.muted}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{pt.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="pricetag-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
              <Text style={styles.sectionLabel}>Price Range</Text>
              <Text style={styles.currencyLabel}>PKR</Text>
            </View>
            <Text style={styles.budgetValue}>
              {minPriceLabel} – {maxPriceLabel}
            </Text>
            <View style={styles.sliderWrap} onLayout={handlePriceSliderLayout}>
              {priceSliderWidth > 0 && (
                <MultiSlider
                  values={[sliderMinValue, sliderMaxValue]}
                  onValuesChange={handlePriceSliderChange}
                  min={0}
                  max={BUDGET_SCALE_MAX}
                  step={BUDGET_STEP}
                  sliderLength={priceSliderWidth}
                  allowOverlap={false}
                  snapped
                  selectedStyle={{ backgroundColor: theme.colors.primary }}
                  unselectedStyle={{ backgroundColor: theme.colors.border }}
                  trackStyle={{ height: 4, borderRadius: 2 }}
                  markerStyle={styles.sliderThumb}
                  pressedMarkerStyle={styles.sliderThumbPressed}
                  containerStyle={styles.sliderContainer}
                />
              )}
            </View>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="0"
                value={draft.minPrice}
                onChangeText={(v) => set('minPrice', v.replace(/\D/g, ''))}
              />
              <Text style={styles.rangeTo}>TO</Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="Any"
                value={draft.maxPrice}
                onChangeText={(v) => set('maxPrice', v.replace(/\D/g, ''))}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Ionicons name="resize-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
              <Text style={styles.sectionLabel}>Area ({draft.areaUnit})</Text>
            </View>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="0"
                value={draft.minAreaValue}
                onChangeText={(v) => set('minAreaValue', v.replace(/\D/g, ''))}
              />
              <Text style={styles.rangeTo}>TO</Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="Any"
                value={draft.maxAreaValue}
                onChangeText={(v) => set('maxAreaValue', v.replace(/\D/g, ''))}
              />
              <View style={styles.unitPicker}>
                <PickerField
                  value={draft.areaUnit}
                  options={AREA_UNITS}
                  title="Area Unit"
                  onChange={(v) => set('areaUnit', v as SearchFilterState['areaUnit'])}
                />
              </View>
            </View>
          </View>

          {showBedsAndBaths && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Ionicons name="bed-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
                  <Text style={styles.sectionLabel}>Bedrooms</Text>
                </View>
                <View style={styles.pillRow}>
                  <Pressable onPress={() => set('bedrooms', '')} style={[styles.pill, !draft.bedrooms && styles.pillActive]}>
                    <Text style={[styles.pillText, !draft.bedrooms && styles.pillTextActive]}>Any</Text>
                  </Pressable>
                  {BED_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => set('bedrooms', opt)}
                      style={[styles.pill, draft.bedrooms === opt && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, draft.bedrooms === opt && styles.pillTextActive]}>{opt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Ionicons name="water-outline" size={18} color={theme.colors.muted} style={styles.sectionIcon} />
                  <Text style={styles.sectionLabel}>Bathrooms</Text>
                </View>
                <View style={styles.pillRow}>
                  <Pressable
                    onPress={() => set('minBathrooms', '')}
                    style={[styles.pill, !draft.minBathrooms && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, !draft.minBathrooms && styles.pillTextActive]}>Any</Text>
                  </Pressable>
                  {BATH_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => set('minBathrooms', opt)}
                      style={[styles.pill, draft.minBathrooms === opt && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, draft.minBathrooms === opt && styles.pillTextActive]}>{opt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}

          <TextInput
            label="Keyword"
            placeholder="e.g. corner plot"
            value={draft.keyword}
            onChangeText={(v) => set('keyword', v)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetLink}>Reset</Text>
          </Pressable>
          <View style={styles.applyButton}>
            <Button label={`Show ${total} results`} onPress={handleApply} size="lg" />
          </View>
        </View>

        <CityPickerModal
          visible={cityPickerVisible}
          onClose={() => setCityPickerVisible(false)}
          onSelect={(c) => {
            set('city', c);
            setCityPickerVisible(false);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerIconButton: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  headerDone: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  content: { padding: theme.spacing.lg },

  section: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sectionIcon: { width: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text, flex: 1 },
  currencyLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },

  settingsRow: { flexDirection: 'row', alignItems: 'center' },
  settingsRowBody: { flex: 1, gap: 2 },
  settingsRowValue: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    padding: 3,
    gap: 3,
  },
  segment: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: 999 },
  segmentActive: { backgroundColor: theme.colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  segmentTextActive: { color: theme.colors.bg },

  categoryTabRow: { flexDirection: 'row', gap: theme.spacing.lg },
  categoryTab: { paddingBottom: theme.spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categoryTabActive: { borderBottomColor: theme.colors.primary },
  categoryTabText: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  categoryTabTextActive: { color: theme.colors.primary },

  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipActive: { backgroundColor: `${theme.colors.primary}1A`, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  chipTextActive: { color: theme.colors.primary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  pillTextActive: { color: theme.colors.bg },

  budgetValue: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
  // Height matches MultiSlider's own thumb hitbox so the wrap doesn't jump
  // between the placeholder (empty, pre-onLayout) and rendered-slider states.
  sliderWrap: { height: 40, justifyContent: 'center' },
  sliderContainer: { height: 40, justifyContent: 'center', paddingHorizontal: 0 },
  sliderThumb: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.bg,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderThumbPressed: { borderColor: theme.colors.primary, backgroundColor: theme.colors.secondaryBg },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rangeInput: { flex: 1 },
  rangeTo: { fontSize: 12, fontWeight: '700', color: theme.colors.muted },
  unitPicker: { width: 90 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  resetLink: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  applyButton: { flex: 1 },
});
