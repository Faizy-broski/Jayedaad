import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Amenity, useTaxonomyViewModel } from '@jayedaad/core';
import { Accordion, Button, Checkbox, PickerField, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

export interface AmenitySelection {
  value?: number;
  textValue?: string;
}
export type AmenitySelectionMap = Map<string, AmenitySelection>;

// Same 7 real AmenityCategory values as apps/web's submit page — decorative
// icon per category, no fabricated meaning beyond "recognizable at a glance."
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  main_features: 'options-outline',
  rooms: 'bed-outline',
  business_communication: 'business-outline',
  community_features: 'shield-checkmark-outline',
  healthcare_recreation: 'medkit-outline',
  nearby_locations: 'location-outline',
  other_facilities: 'ellipsis-horizontal-circle-outline',
};

function humanizeCategory(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Zameen-style "Add Features" screen (real Figma reference) — an Accordion
// per amenity category (server-filtered to the listing's property type,
// same as web's popup modal), each amenity rendered by its real valueType.
// Draft-then-commit: selections only apply to PostListingScreen's real state
// when "Done" is pressed (via the onDone param callback).
export function AddFeaturesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddFeatures'>>();
  const { categorySlug, initialSelection, onDone } = route.params;
  const { amenities, isLoading } = useTaxonomyViewModel(categorySlug);
  const [draft, setDraft] = useState<AmenitySelectionMap>(new Map(initialSelection));

  const amenitiesByCategory = amenities.reduce<Record<string, Amenity[]>>((acc, amenity) => {
    (acc[amenity.category] ??= []).push(amenity);
    return acc;
  }, {});

  function setSelection(slug: string, selection: AmenitySelection | null) {
    setDraft((prev) => {
      const next = new Map(prev);
      if (selection === null) next.delete(slug);
      else next.set(slug, selection);
      return next;
    });
  }

  function handleDone() {
    onDone(draft);
    navigation.goBack();
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <Text style={styles.muted}>Loading…</Text>}
        {!isLoading && Object.keys(amenitiesByCategory).length === 0 && (
          <Text style={styles.muted}>No features available for this property type.</Text>
        )}
        {Object.entries(amenitiesByCategory).map(([category, items]) => (
          <Accordion key={category} icon={CATEGORY_ICONS[category] ?? 'ellipse-outline'} label={humanizeCategory(category)}>
            {items.map((amenity) => (
              <View key={amenity.slug} style={styles.row}>
                <Text style={styles.rowLabel}>{amenity.label}</Text>
                {amenity.valueType === 'boolean' && (
                  <Checkbox
                    checked={draft.has(amenity.slug)}
                    onChange={(checked) => setSelection(amenity.slug, checked ? {} : null)}
                  />
                )}
                {amenity.valueType === 'number' && (
                  <RNTextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder={amenity.valueUnit ?? ''}
                    placeholderTextColor={theme.colors.muted}
                    value={draft.get(amenity.slug)?.value != null ? String(draft.get(amenity.slug)!.value) : ''}
                    onChangeText={(text) => setSelection(amenity.slug, text ? { value: Number(text) } : null)}
                  />
                )}
                {amenity.valueType === 'text' && (
                  <RNTextInput
                    style={styles.input}
                    value={draft.get(amenity.slug)?.textValue ?? ''}
                    onChangeText={(text) => setSelection(amenity.slug, text ? { textValue: text } : null)}
                  />
                )}
                {amenity.valueType === 'select' && (
                  <View style={styles.pickerWrap}>
                    <PickerField
                      value={draft.get(amenity.slug)?.textValue ?? ''}
                      options={amenity.options ?? []}
                      placeholder="Select"
                      title={amenity.label}
                      onChange={(value) => setSelection(amenity.slug, value ? { textValue: value } : null)}
                    />
                  </View>
                )}
              </View>
            ))}
          </Accordion>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingHorizontal: theme.spacing.lg },
  muted: { padding: theme.spacing.lg, fontSize: 13, color: theme.colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  rowLabel: { flex: 1, fontSize: 14, color: theme.colors.text },
  input: {
    width: 140,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'right',
  },
  pickerWrap: { width: 140 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
});
