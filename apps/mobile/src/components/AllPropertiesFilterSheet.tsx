import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, PAKISTAN_CITIES, useListingSearchViewModel, useTaxonomyViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { AREA_UNITS, BATH_OPTIONS, BED_OPTIONS } from '../lib/searchFilters';
import { AllPropertiesFilterState, DEFAULT_ALL_PROPERTIES_FILTERS, toAllPropertiesSearchFilters } from '../lib/allPropertiesFilters';

export interface AllPropertiesFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: AllPropertiesFilterState;
  onApply: (next: AllPropertiesFilterState) => void;
}

// Full filter drawer for the "All Properties" browse screen — same fields
// and draft-then-commit pattern as SearchFilterSheet.tsx, minus the Buy/Rent
// Purpose toggle: this screen intentionally shows every verified listing
// regardless of purpose, same as ProjectsScreen has no type split. Property
// Type/Beds/Baths are direct inline pill selections rather than sub-modals,
// matching SearchFilterSheet's chip-based treatment.
export function AllPropertiesFilterSheet({ visible, onClose, value, onApply }: AllPropertiesFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<AllPropertiesFilterState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const { total } = useListingSearchViewModel(toAllPropertiesSearchFilters(draft));

  function set<K extends keyof AllPropertiesFilterState>(key: K, val: AllPropertiesFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  const selectedCategorySlug = propertyTypes.find((t) => t.slug === draft.propertyTypeSlug)?.category.slug;
  const showBedsAndBaths = selectedCategorySlug !== 'plot' && selectedCategorySlug !== 'commercial';

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_ALL_PROPERTIES_FILTERS);
  }

  const minPriceLabel = draft.minPrice ? formatPrice(Number(draft.minPrice)) : 'Any';
  const maxPriceLabel = draft.maxPrice ? formatPrice(Number(draft.maxPrice)) : 'Any';
  const BUDGET_SCALE_MAX = 150_000_000;
  const barLeft = draft.minPrice ? Math.min(100, (Number(draft.minPrice) / BUDGET_SCALE_MAX) * 100) : 0;
  const barRight = draft.maxPrice ? Math.min(100, (Number(draft.maxPrice) / BUDGET_SCALE_MAX) * 100) : 100;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.headerIconButton}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Filters</Text>
          <View style={styles.headerIconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pillRow}>
              <Pressable
                onPress={() => set('propertyTypeSlug', '')}
                style={[styles.pill, !draft.propertyTypeSlug && styles.pillActive]}
              >
                <Text style={[styles.pillText, !draft.propertyTypeSlug && styles.pillTextActive]}>Any Type</Text>
              </Pressable>
              {propertyTypes.map((pt) => (
                <Pressable
                  key={pt.slug}
                  onPress={() => set('propertyTypeSlug', pt.slug)}
                  style={[styles.pill, draft.propertyTypeSlug === pt.slug && styles.pillActive]}
                >
                  <Text style={[styles.pillText, draft.propertyTypeSlug === pt.slug && styles.pillTextActive]}>
                    {pt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City</Text>
            <PickerField
              value={draft.city}
              options={PAKISTAN_CITIES}
              placeholder="Any City"
              title="Select City"
              onChange={(v) => set('city', v)}
            />
          </View>

          <TextInput
            label="Location"
            placeholder="Search location"
            value={draft.area}
            onChangeText={(v) => set('area', v)}
          />

          <View style={styles.field}>
            <View style={styles.budgetHeaderRow}>
              <Text style={styles.label}>Budget</Text>
              <Text style={styles.budgetValue}>
                {minPriceLabel} – {maxPriceLabel}
              </Text>
            </View>
            <View style={styles.budgetBarTrack}>
              <View style={[styles.budgetBarFill, { left: `${barLeft}%`, right: `${100 - barRight}%` }]} />
            </View>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="0"
                value={draft.minPrice}
                onChangeText={(v) => set('minPrice', v.replace(/\D/g, ''))}
              />
              <Text style={styles.rangeTo}>to</Text>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="Any"
                value={draft.maxPrice}
                onChangeText={(v) => set('maxPrice', v.replace(/\D/g, ''))}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Area ({draft.areaUnit})</Text>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.rangeInput}
                keyboardType="number-pad"
                placeholder="0"
                value={draft.minAreaValue}
                onChangeText={(v) => set('minAreaValue', v.replace(/\D/g, ''))}
              />
              <Text style={styles.rangeTo}>to</Text>
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
                  onChange={(v) => set('areaUnit', v as AllPropertiesFilterState['areaUnit'])}
                />
              </View>
            </View>
          </View>

          {showBedsAndBaths && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Bedrooms</Text>
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

              <View style={styles.field}>
                <Text style={styles.label}>Bathrooms</Text>
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
          <Pressable style={styles.resetButton} onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetLink}>Reset</Text>
          </Pressable>
          <View style={styles.applyButton}>
            <Button label={`Show ${total} results`} onPress={handleApply} size="lg" />
          </View>
        </View>
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
  headerIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  field: { gap: theme.spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.text },

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

  budgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetValue: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
  budgetBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  budgetBarFill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: theme.colors.primary, borderRadius: 2 },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rangeInput: { flex: 1 },
  rangeTo: { fontSize: 13, color: theme.colors.muted },
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
  resetButton: {
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  resetLink: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  applyButton: { flex: 1 },
});
