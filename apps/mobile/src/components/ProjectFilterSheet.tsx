import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PAKISTAN_CITIES, useTaxonomyViewModel } from '@jayedaad/core';
import { Button, PickerField, TextInput, theme } from '@jayedaad/ui-native';
import { PropertyTypePicker } from './PropertyTypePicker';
import { DeveloperPicker } from './DeveloperPicker';
import { AREA_UNITS } from '../lib/searchFilters';
import { DEFAULT_PROJECT_FILTERS, ProjectFilterState } from '../lib/projectFilters';

export interface ProjectFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: ProjectFilterState;
  onApply: (next: ProjectFilterState) => void;
}

// Full "Search Projects" drawer — City, Project Title, Developer Title,
// Property Type, Price Range, Area Range — structurally identical to
// SearchFilterSheet.tsx's draft-then-commit pattern, adapted to
// ProjectFilterState/ProjectSearchFilters instead of listings'.
export function ProjectFilterSheet({ visible, onClose, value, onApply }: ProjectFilterSheetProps) {
  const { propertyTypes } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<ProjectFilterState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Projects</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <Text style={styles.label}>Property Type</Text>
            <PropertyTypePicker
              value={draft.propertyTypeSlug}
              propertyTypes={propertyTypes}
              onChange={(slug) => set('propertyTypeSlug', slug)}
            />
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
