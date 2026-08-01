import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface PickerFieldProps {
  value: string;
  options: string[];
  placeholder?: string;
  title?: string;
  onChange: (value: string) => void;
  // "pill": fully-rounded, filled, borderless trigger (photo-background auth
  // screens). Omit for the existing bordered-rectangle default everywhere
  // else.
  variant?: 'default' | 'pill';
  disabled?: boolean;
}

// RN has no native <select> — this is the searchable full-screen-modal
// equivalent used everywhere a long static option list (cities, etc.) needs
// picking on mobile, mirroring ui-web's <Select>.
export function PickerField({
  value,
  options,
  placeholder = 'Select',
  title = 'Select',
  onChange,
  variant = 'default',
  disabled = false,
}: PickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options;

  function close() {
    setVisible(false);
    setQuery('');
  }

  return (
    <>
      <Pressable
        style={[styles.trigger, variant === 'pill' && styles.triggerPill, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
      </Pressable>
      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={close}>
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
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onChange(item);
                  close();
                }}
              >
                <Text style={styles.rowText}>{item}</Text>
                {item === value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
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
  triggerDisabled: {
    opacity: 0.5,
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
