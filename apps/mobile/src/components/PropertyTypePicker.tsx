import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PropertyType } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

// Homes -> Plots -> Commercial, matching the order these categories are
// seeded server-side (supabase/migrations/0005_taxonomy_seed.sql).
const CATEGORY_ORDER = ['residential', 'plot', 'commercial'];

export interface PropertyTypePickerProps {
  value: string; // selected property type slug, '' for "Any Type"
  propertyTypes: PropertyType[];
  variant?: 'default' | 'pill';
  onChange: (slug: string) => void;
}

// A flat 17-item list of every property type across Homes/Plots/Commercial
// is hard to scan — this drills down instead: pick a category first, then
// only that category's own types show. Same full-screen Modal shell as
// PickerField (RN has no native <select>), just two list "screens" instead
// of one.
export function PropertyTypePicker({ value, propertyTypes, variant = 'default', onChange }: PropertyTypePickerProps) {
  const [visible, setVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ slug: string; label: string } | null>(null);
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const seen = new Map<string, { slug: string; label: string }>();
    for (const t of propertyTypes) {
      if (!seen.has(t.category.slug)) seen.set(t.category.slug, t.category);
    }
    return CATEGORY_ORDER.map((slug) => seen.get(slug)).filter((c): c is { slug: string; label: string } => !!c);
  }, [propertyTypes]);

  const selected = propertyTypes.find((t) => t.slug === value);

  function open() {
    setActiveCategory(selected ? selected.category : null);
    setQuery('');
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function selectType(slug: string) {
    onChange(slug);
    close();
  }

  const typesInCategory = activeCategory ? propertyTypes.filter((t) => t.category.slug === activeCategory.slug) : [];
  const filteredTypes = query
    ? typesInCategory.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()))
    : typesInCategory;

  return (
    <>
      <Pressable style={[styles.trigger, variant === 'pill' && styles.triggerPill]} onPress={open}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>{selected?.label ?? 'Any Type'}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            {activeCategory ? (
              <Pressable style={styles.backRow} onPress={() => setActiveCategory(null)} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                <Text style={styles.modalTitle}>{activeCategory.label}</Text>
              </Pressable>
            ) : (
              <Text style={styles.modalTitle}>Select Property Type</Text>
            )}
            <Pressable onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          {activeCategory ? (
            <>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                placeholderTextColor={theme.colors.muted}
                style={styles.search}
              />
              <FlatList
                data={filteredTypes}
                keyExtractor={(item) => item.slug}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable style={styles.row} onPress={() => selectType(item.slug)}>
                    <Text style={styles.rowText}>{item.label}</Text>
                    {item.slug === value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
              />
            </>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.slug}
              ListHeaderComponent={
                <Pressable style={styles.row} onPress={() => selectType('')}>
                  <Text style={styles.rowText}>Any Type</Text>
                  {!value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => setActiveCategory(item)}>
                  <Text style={styles.rowText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  triggerPill: {
    borderWidth: 0,
    borderRadius: 999,
    backgroundColor: theme.colors.secondaryBg,
  },
  triggerText: { fontSize: 14, color: theme.colors.text },
  placeholder: { color: theme.colors.muted },
  modal: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 56, paddingHorizontal: theme.spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  modalTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  search: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowText: { fontSize: 14, color: theme.colors.text },
  empty: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.xl },
});
