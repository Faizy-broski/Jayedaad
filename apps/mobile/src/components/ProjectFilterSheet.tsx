import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, PAKISTAN_CITIES, useProjectsViewModel, useTaxonomyViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { DeveloperPicker } from './DeveloperPicker';
import { AREA_UNITS } from '../lib/searchFilters';
import { DEFAULT_PROJECT_FILTERS, ProjectFilterState, toProjectSearchFilters } from '../lib/projectFilters';

export interface ProjectFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: ProjectFilterState;
  onApply: (next: ProjectFilterState) => void;
}

// Full "Search Projects" drawer — City, Project Title, Developer Title,
// Property Type, Price Range, Area Range — structurally identical to
// SearchFilterSheet.tsx's draft-then-commit pattern, adapted to
// ProjectFilterState/ProjectSearchFilters instead of listings'. Property
// Type is a direct inline pill row rather than a sub-modal, matching
// SearchFilterSheet's chip-based treatment; Developer/City stay searchable
// modal pickers (real, potentially long lists).
export function ProjectFilterSheet({ visible, onClose, value, onApply }: ProjectFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<ProjectFilterState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

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
          <Text style={styles.headerTitle}>Search Projects</Text>
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
              placeholder="All Cities"
              title="Select City"
              onChange={(v) => set('city', v)}
            />
          </View>

          <TextInput
            label="Project Title"
            placeholder="Search projects"
            value={draft.keyword}
            onChangeText={(v) => set('keyword', v)}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Developer</Text>
            <DeveloperPicker value={draft.developerSlug} onChange={(slug) => set('developerSlug', slug)} />
          </View>

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
                  onChange={(v) => set('areaUnit', v as ProjectFilterState['areaUnit'])}
                />
              </View>
            </View>
          </View>
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
