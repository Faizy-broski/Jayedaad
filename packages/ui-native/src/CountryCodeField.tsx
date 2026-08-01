import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from './theme';

export interface CountryCodeOption {
  name: string;
  dialCode: string;
  iso2: string;
}

export interface CountryCodeFieldProps {
  countries: CountryCodeOption[];
  value: string;
  onChange: (dialCode: string) => void;
  // "pill": fully-rounded, filled, borderless trigger (photo-background auth
  // screens, sitting beside a pill-variant phone TextInput). Omit for the
  // existing bordered-rectangle default everywhere else.
  variant?: 'default' | 'pill';
}

// Same regional-indicator-emoji trick as ui-web's CountryCodeSelect — no
// image assets, works cross-platform.
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// RN has no native <select>; this is the flag+abbreviation+dial-code
// equivalent of ui-web's CountryCodeSelect, using the same full-screen
// searchable modal pattern as PickerField.
export function CountryCodeField({ countries, value, onChange, variant = 'default' }: CountryCodeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selected = countries.find((c) => c.dialCode === value) ?? countries[0];
  const filtered = query
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.iso2.toLowerCase().includes(query.toLowerCase()) ||
          c.dialCode.includes(query),
      )
    : countries;

  function close() {
    setVisible(false);
    setQuery('');
  }

  return (
    <>
      <Pressable style={[styles.trigger, variant === 'pill' && styles.triggerPill]} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText} numberOfLines={1} adjustsFontSizeToFit>
          {flagEmoji(selected.iso2)} {selected.iso2} +{selected.dialCode}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.colors.muted} />
      </Pressable>
      <Modal visible={visible} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <Pressable onPress={close}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or code…"
            placeholderTextColor={theme.colors.muted}
            style={styles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => `${item.iso2}-${item.dialCode}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onChange(item.dialCode);
                  close();
                }}
              >
                <Text style={styles.rowText}>
                  {flagEmoji(item.iso2)} {item.name}
                </Text>
                <Text style={styles.rowCode}>+{item.dialCode}</Text>
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
    gap: 4,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    // Matches TextInput's own paddingVertical/fontSize so the picker is the
    // same height as the phone-number field it always sits beside, with no
    // fill color so it reads as one continuous field, not a separate box.
    paddingVertical: theme.spacing.sm,
  },
  triggerPill: {
    borderWidth: 0,
    borderRadius: 999,
    backgroundColor: theme.colors.secondaryBg,
    paddingHorizontal: theme.spacing.md,
  },
  triggerText: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
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
  rowText: { fontSize: 14, color: theme.colors.text, flex: 1 },
  rowCode: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
  empty: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.xl },
});
