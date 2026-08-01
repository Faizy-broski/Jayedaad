import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PAKISTAN_CITIES, useTaxonomyViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { PropertyTypePicker } from './PropertyTypePicker';
import { AREA_UNITS, BATH_OPTIONS, BED_OPTIONS, DEFAULT_SEARCH_FILTERS, SearchFilterState } from '../lib/searchFilters';

export interface SearchFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: SearchFilterState;
  onApply: (next: SearchFilterState) => void;
}

// Full-screen slide-up Modal (RN has no bottom-sheet primitive in this repo
// — same hand-rolled Modal+Animated approach as PickerField/SideDrawer,
// rather than pulling in a gesture-handler/reanimated-based library): Purpose,
// City, Location, Property Type, Area range, Price range, Beds/Baths (Homes
// only — see showBedsAndBaths below), Keyword. Draft-then-commit, same
// pattern as AddFeaturesScreen — edits apply only when "Show Results" is
// pressed, not live per-keystroke.
export function SearchFilterSheet({ visible, onClose, value, onApply }: SearchFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<SearchFilterState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

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

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_SEARCH_FILTERS);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.purposeRow}>
            {(['sale', 'rent'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => set('purpose', p)}
                style={[styles.purposeTab, draft.purpose === p && styles.purposeTabActive]}
              >
                <Text style={[styles.purposeText, draft.purpose === p && styles.purposeTextActive]}>
                  {p === 'sale' ? 'Buy' : 'Rent'}
                </Text>
              </Pressable>
            ))}
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
            <Text style={styles.label}>Property Type</Text>
            <PropertyTypePicker
              value={draft.propertyTypeSlug}
              propertyTypes={propertyTypes}
              onChange={(slug) => set('propertyTypeSlug', slug)}
            />
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
                  onChange={(v) => set('areaUnit', v as SearchFilterState['areaUnit'])}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Price (PKR)</Text>
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

          {showBedsAndBaths && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Beds</Text>
                <PickerField
                  value={draft.bedrooms}
                  options={BED_OPTIONS}
                  placeholder="All"
                  title="Bedrooms"
                  onChange={(v) => set('bedrooms', v)}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Baths</Text>
                <PickerField
                  value={draft.minBathrooms}
                  options={BATH_OPTIONS}
                  placeholder="All"
                  title="Bathrooms"
                  onChange={(v) => set('minBathrooms', v)}
                />
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
            <Button label="Show Results" onPress={handleApply} size="lg" />
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  purposeRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondaryBg,
    borderRadius: 999,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  purposeTab: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: 999, alignItems: 'center' },
  purposeTabActive: { backgroundColor: theme.colors.bg },
  purposeText: { color: theme.colors.muted, fontWeight: '600' },
  purposeTextActive: { color: theme.colors.text },
  field: { gap: theme.spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rangeInput: { flex: 1 },
  rangeTo: { fontSize: 13, color: theme.colors.muted },
  unitPicker: { width: 90 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  resetLink: { fontSize: 14, fontWeight: '600', color: theme.colors.muted },
  applyButton: { flex: 1 },
});
