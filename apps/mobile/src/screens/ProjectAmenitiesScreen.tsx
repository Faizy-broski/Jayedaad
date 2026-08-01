import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTaxonomyViewModel } from '@jayedaad/core';
import { Accordion, Button, Checkbox, theme } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

// Same 7 real AmenityCategory values as AddFeaturesScreen.tsx.
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  main_features: 'options-outline',
  rooms: 'bed-outline',
  business_communication: 'business-outline',
  community_features: 'shield-checkmark-outline',
  healthcare_recreation: 'medkit-outline',
  nearby_locations: 'location-outline',
  other_facilities: 'ellipsis-horizontal-circle-outline',
  plot_features: 'map-outline',
};

function humanizeCategory(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Simplified sibling of AddFeaturesScreen — a project's amenitySlugs are
// plain boolean toggles (no per-amenity value/textValue like a listing's
// amenities carry), matching apps/web's ProjectForm.tsx chip picker, which
// also ignores each amenity's valueType and just toggles the slug. Same
// Accordion-per-category + draft-then-commit navigation pattern otherwise.
export function ProjectAmenitiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProjectAmenities'>>();
  const { initialSelection, onDone } = route.params;
  const { amenities, isLoading } = useTaxonomyViewModel();
  const [draft, setDraft] = useState<Set<string>>(new Set(initialSelection));

  const amenitiesByCategory = amenities.reduce<Record<string, typeof amenities>>((acc, amenity) => {
    (acc[amenity.category] ??= []).push(amenity);
    return acc;
  }, {});

  function toggle(slug: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleDone() {
    onDone(Array.from(draft));
    navigation.goBack();
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <Text style={styles.muted}>Loading…</Text>}
        {!isLoading && Object.keys(amenitiesByCategory).length === 0 && (
          <Text style={styles.muted}>No amenities configured yet.</Text>
        )}
        {Object.entries(amenitiesByCategory).map(([category, items]) => (
          <Accordion key={category} icon={CATEGORY_ICONS[category] ?? 'ellipse-outline'} label={humanizeCategory(category)}>
            {items.map((amenity) => (
              <View key={amenity.slug} style={styles.row}>
                <Text style={styles.rowLabel}>{amenity.label}</Text>
                <Checkbox checked={draft.has(amenity.slug)} onChange={() => toggle(amenity.slug)} />
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
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
});
