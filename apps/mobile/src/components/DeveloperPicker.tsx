import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDevelopersViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';

export interface DeveloperPickerProps {
  value: string; // selected developer slug, '' for "Any Developer"
  variant?: 'default' | 'pill';
  onChange: (slug: string) => void;
}

// Flat (no category drill-down, unlike PropertyTypePicker) full-screen
// search+list Modal — real developers via the public GET /developers
// endpoint (useDevelopersViewModel, previously only used by agent-side
// project-creation forms, but the underlying endpoint is @Public()).
export function DeveloperPicker({ value, variant = 'default', onChange }: DeveloperPickerProps) {
  const { developers } = useDevelopersViewModel();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selected = developers.find((d) => d.slug === value);
  const filtered = query ? developers.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())) : developers;

  function close() {
    setVisible(false);
    setQuery('');
  }

  function select(slug: string) {
    onChange(slug);
    close();
  }

  return (
    <>
      <Pressable style={[styles.trigger, variant === 'pill' && styles.triggerPill]} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>{selected?.name ?? 'Any Developer'}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
      </Pressable>

      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Developer</Text>
            <Pressable onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search…"
            placeholderTextColor={theme.colors.muted}
            style={styles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable style={styles.row} onPress={() => select('')}>
                <Text style={styles.rowText}>Any Developer</Text>
                {!value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => select(item.slug)}>
                <Text style={styles.rowText}>{item.name}</Text>
                {item.slug === value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          />
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
    borderRadius: theme.radius.sm,
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
