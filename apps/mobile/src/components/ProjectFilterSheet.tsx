import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { formatPrice, useProjectsViewModel, useTaxonomyViewModel } from '@jayedaad/core';
import { BackButton, Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { DeveloperPicker } from './DeveloperPicker';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput';
import { CityPickerModal } from './CityPickerModal';
import { AREA_UNITS } from '../lib/searchFilters';
import { DEFAULT_PROJECT_FILTERS, ProjectFilterState, toProjectSearchFilters } from '../lib/projectFilters';

export interface ProjectFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: ProjectFilterState;
  onApply: (next: ProjectFilterState) => void;
}

// Same friendly presets over the real minAreaValue/maxAreaValue/areaUnit
// range as SearchFilterSheet.tsx's LAND_AREA_PRESETS — kept in sync.
const LAND_AREA_PRESETS: { label: string; value: string; unit: ProjectFilterState['areaUnit'] }[] = [
  { label: '5 Marla', value: '5', unit: 'marla' },
  { label: '10 Marla', value: '10', unit: 'marla' },
  { label: '1 Kanal', value: '1', unit: 'kanal' },
  { label: '2 Kanal', value: '2', unit: 'kanal' },
];

// Full "Search Projects" drawer — City, Location, Project Title, Developer,
// Property Type, Budget, Land area — restyled to match SearchFilterSheet.tsx's
// spacious pill-grid layout exactly (same header, section spacing, category
// tabs, budget slider + rounded inputs, footer) instead of the earlier denser
// bordered-row treatment, so both filter sheets feel like one design system.
export function ProjectFilterSheet({ visible, onClose, value, onApply }: ProjectFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<ProjectFilterState>(value);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('');
  const [priceSliderWidth, setPriceSliderWidth] = useState(0);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  // Category first (Homes/Plots/Commercial), then the types within it —
  // same two-step pattern as SearchFilterSheet.tsx, not one flat grid of
  // every seeded type at once.
  const categories = propertyTypes.reduce<{ slug: string; label: string }[]>((acc, t) => {
    if (t.category && !acc.some((c) => c.slug === t.category.slug)) acc.push(t.category);
    return acc;
  }, []);

  useEffect(() => {
    if (!visible || categories.length === 0) return;
    const selectedCategory = propertyTypes.find((t) => t.slug === draft.propertyTypeSlug)?.category.slug;
    setActiveCategorySlug(selectedCategory ?? categories[0].slug);
  }, [visible]);

  const typesInActiveCategory = propertyTypes.filter((t) => t.category.slug === activeCategorySlug);

  const { total } = useProjectsViewModel(toProjectSearchFilters(draft));

  function set<K extends keyof ProjectFilterState>(key: K, val: ProjectFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_PROJECT_FILTERS);
  }

  const minPriceLabel = draft.minPrice ? formatPrice(Number(draft.minPrice)) : 'Any';
  const maxPriceLabel = draft.maxPrice ? formatPrice(Number(draft.maxPrice)) : 'Any';
  // Same fixed 0-15 Cr reference range/step as SearchFilterSheet.tsx.
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

  const isAreaPresetActive = (preset: (typeof LAND_AREA_PRESETS)[number]) =>
    !draft.minAreaValue && draft.maxAreaValue === preset.value && draft.areaUnit === preset.unit;
  const isAreaAnyActive = !draft.minAreaValue && !draft.maxAreaValue;

  function selectAreaPreset(preset: (typeof LAND_AREA_PRESETS)[number]) {
    setDraft((prev) => ({ ...prev, minAreaValue: '', maxAreaValue: preset.value, areaUnit: preset.unit }));
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={handleReset} hitSlop={8} style={styles.headerResetButton}>
            <Ionicons name="refresh" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Property type</Text>
            <View style={styles.categoryTabRow}>
              {categories.map((c) => {
                const active = c.slug === activeCategorySlug;
                return (
                  <Pressable key={c.slug} onPress={() => setActiveCategorySlug(c.slug)} style={[styles.categoryTab, active && styles.categoryTabActive]}>
                    <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.pillRow}>
              <Pressable onPress={() => set('propertyTypeSlug', '')} style={[styles.pill, !draft.propertyTypeSlug && styles.pillActive]}>
                <Text style={[styles.pillText, !draft.propertyTypeSlug && styles.pillTextActive]}>Any</Text>
              </Pressable>
              {typesInActiveCategory.map((pt) => {
                const active = draft.propertyTypeSlug === pt.slug;
                return (
                  <Pressable key={pt.slug} onPress={() => set('propertyTypeSlug', pt.slug)} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{pt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Budget</Text>
              <Text style={styles.budgetValue}>
                {minPriceLabel} – {maxPriceLabel}
              </Text>
            </View>
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
            <View style={styles.sliderScaleRow}>
              <Text style={styles.sliderScaleText}>{formatPrice(0)}</Text>
              <Text style={styles.sliderScaleText}>{formatPrice(BUDGET_SCALE_MAX)}</Text>
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
            <Text style={styles.sectionLabel}>Land area</Text>
            <View style={styles.pillRow}>
              <Pressable
                onPress={() => setDraft((prev) => ({ ...prev, minAreaValue: '', maxAreaValue: '' }))}
                style={[styles.pill, isAreaAnyActive && styles.pillActive]}
              >
                <Text style={[styles.pillText, isAreaAnyActive && styles.pillTextActive]}>Any</Text>
              </Pressable>
              {LAND_AREA_PRESETS.map((preset) => {
                const active = isAreaPresetActive(preset);
                return (
                  <Pressable key={preset.label} onPress={() => selectAreaPreset(preset)} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{preset.label}</Text>
                  </Pressable>
                );
              })}
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
                  onChange={(v) => set('areaUnit', v as ProjectFilterState['areaUnit'])}
                  style={styles.roundedField}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <Pressable style={styles.settingsRow} onPress={() => setCityPickerVisible(true)}>
              <Ionicons name="location-outline" size={18} color={theme.colors.muted} />
              <Text style={styles.settingsRowBody}>{draft.city || 'Any City'}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
            <PlacesAutocompleteInput
              placeholder="e.g. Bahria Town, DHA"
              value={draft.area}
              onChange={(v) => set('area', v)}
              style={styles.roundedField}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Developer</Text>
            <DeveloperPicker value={draft.developerSlug} onChange={(slug) => set('developerSlug', slug)} style={styles.roundedField} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Project title</Text>
            <TextInput
              placeholder="Search projects"
              value={draft.keyword}
              onChangeText={(v) => set('keyword', v)}
              style={styles.roundedField}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  headerResetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No per-row borders/dividers — spacious whitespace between sections
  // instead, matching SearchFilterSheet.tsx's layout exactly.
  content: { padding: theme.spacing.xl, gap: theme.spacing.xxl },
  section: { gap: theme.spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },

  categoryTabRow: { flexDirection: 'row', gap: theme.spacing.lg },
  categoryTab: { paddingBottom: theme.spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  categoryTabActive: { borderBottomColor: theme.colors.primary },
  categoryTabText: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  categoryTabTextActive: { color: theme.colors.primary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  pillTextActive: { color: theme.colors.bg },

  budgetValue: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
  sliderWrap: { height: 40, justifyContent: 'center' },
  sliderContainer: { height: 40, justifyContent: 'center', paddingHorizontal: 0 },
  sliderThumb: {
    height: 24,
    width: 24,
    borderRadius: 12,
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
  sliderScaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -theme.spacing.xs },
  sliderScaleText: { fontSize: 11, color: theme.colors.mutedLight },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rangeInput: { flex: 1, borderRadius: 14 },
  roundedField: { borderRadius: 14 },
  rangeTo: { fontSize: 12, fontWeight: '700', color: theme.colors.muted },
  unitPicker: { width: 90 },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  settingsRowBody: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  resetButton: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 999,
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { fontSize: 14, fontWeight: '700', color: theme.colors.muted },
  applyButton: { flex: 1 },
});
